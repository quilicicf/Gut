import log from '../../../dependencies/log.ts';
import { isEmpty } from '../../../dependencies/ramda.ts';
import { promptConfirm } from '../../../dependencies/cliffy.ts';
import { stoyle, stoyleGlobal, theme } from '../../../dependencies/stoyle.ts';
import {
  ExtraPermissions, YargsOptions,
  bindOptionsAndCreateUsage, toYargsCommand, toYargsUsage,
} from '../../../dependencies/yargs.ts';

import { getCurrentBranchName } from '../../../lib/git/getCurrentBranchName.ts';
import { DEFAULT_REMOTE, findRemote, LOCAL_REMOTE } from '../../../lib/git/remotes.ts';

import { isPocBranch } from '../../../lib/branch/isPocBranch.ts';
import { parseBranchName } from '../../../lib/branch/parseBranchName.ts';

import { executeAndGetStdout } from '../../../lib/exec/executeAndGetStdout.ts';
import { executeProcessCriticalTask } from '../../../lib/exec/executeProcessCriticalTask.ts';

const ONE_MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

interface Args {
  remote: string;
}

export const baseCommand = 'prune-local-branches';
export const aliases = [ 'plb' ];
export const describe = [
  'Removes all local branches that:',
  '  * have no remote counter-part',
  '  * are not tagged as PoC',
  '  * are older than a month',
  '  * are not `master`, or the current branch',
].join('\n');
export const options: YargsOptions = {
  remote: {
    alias: 'r',
    default: DEFAULT_REMOTE.name,
    describe: 'The remote used to find remote counter-parts',
    type: 'string',
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: any) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

interface BranchInfo {
  timestamp: number;
  sha: string;
  name: string;
}

const getBranchesInfo = async (remoteName?: string): Promise<{ [ key: string ]: BranchInfo }> => {
  const refsLocation = remoteName ? `refs/remotes/${remoteName}/` : 'refs/heads/';
  const localBranchLines = await executeAndGetStdout([
    'git',
    'for-each-ref',
    '--sort=-committerdate',
    `--format=%(committerdate:unix)%09%(objectname)%09%(refname:short)`,
    refsLocation,
  ], { shouldTruncateTrailingLineBreak: true });

  return localBranchLines
    .split('\n')
    .map((line) => {
      const [ timestampAsString, sha, name ] = line.split('\t');
      const timestamp = parseInt(timestampAsString, 10);
      return { timestamp, sha, name };
    })
    .reduce((seed, branchInfo) => ({ ...seed, [ branchInfo.name ]: branchInfo }), {});
};

export async function handler (args: Args) {
  const { remote: remoteArgument } = args;

  const remote = findRemote(remoteArgument);

  await log(Deno.stdout, stoyleGlobal`Fetching remote ${remote.coloredName}\n`(theme.emphasis));
  await executeProcessCriticalTask([ 'git', 'fetch', remote.name ]);

  const localBranchesInfo = await getBranchesInfo();
  const remoteBranchesInfo = await getBranchesInfo(remote.name);

  const now = Math.trunc(new Date().getTime() / 1_000);
  const oneMonthAgo = now - ONE_MONTH_IN_SECONDS;

  const currentBranchName = await getCurrentBranchName();

  const branchesToPrune = Object.values(localBranchesInfo)
    .filter(({ name }) => !Boolean(remoteBranchesInfo[ name ]))
    .filter(({ timestamp }) => timestamp < oneMonthAgo)
    .filter(({ name }) => !isPocBranch(parseBranchName(name)))
    .filter(({ name }) => name !== currentBranchName)
    .filter(({ name }) => name !== 'master');

  if (isEmpty(branchesToPrune)) {
    await log(Deno.stdout, stoyleGlobal`Repository is already clean!\n`(theme.success));
    Deno.exit(0);
  }

  const branchesMessage = branchesToPrune
    .map(({ name }) => `  * ${name}`)
    .join('\n');

  await log(
    Deno.stdout,
    stoyle`I'm about to remove these local branches:\n${branchesMessage}\n`({
      edges: [ theme.strong, undefined ],
    }),
  );

  const shouldGoOn = await promptConfirm({ message: 'Is that OK?', default: false });
  if (!shouldGoOn) {
    await log(Deno.stdout, 'Operation aborted\n');
    Deno.exit(0);
  }

  const deletions = branchesToPrune.map(({ name }) => LOCAL_REMOTE.deleteBranchCommand(name));
  await Promise.all(deletions);
}
