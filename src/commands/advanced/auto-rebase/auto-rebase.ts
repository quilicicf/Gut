import {
  bindOptionsAndCreateUsage,
  ExtraPermissions,
  toYargsCommand,
  toYargsUsage,
  YargsInstance,
  YargsOptions,
} from '../../../dependencies/yargs.ts';

import { isDirty } from '../../../lib/git/isDirty.ts';
import { moveUpTop } from '../../../lib/git/moveUpTop.ts';
import { DEFAULT_REMOTE, findRemote } from '../../../lib/git/remotes.ts';
import { getParentBranch } from '../../../lib/branch/getParentBranch.ts';
import { stringifyBranch } from '../../../lib/branch/stringifyBranch.ts';
import { parseBranchName } from '../../../lib/branch/parseBranchName.ts';
import { getCurrentBranchName } from '../../../lib/git/getCurrentBranchName.ts';
import { executeProcessCriticalTask } from '../../../lib/exec/executeProcessCriticalTask.ts';
import { executeProcessCriticalTasks } from '../../../lib/exec/executeProcessCriticalTasks.ts';

interface Args {
  remote: string;
  base: string;
}

export const baseCommand = 'auto-rebase';
export const aliases = [ 'ar' ];
export const describe = [
  'Re-bases the parent branch on the given remote, then re-bases the current branch on top of it. ',
  'Stashes the local changes first if there are any',
].join('\n');
export const options: YargsOptions = {
  remote: {
    type: 'string',
    alias: 'r',
    describe: 'The remote to fetch',
    default: DEFAULT_REMOTE.name,
    requiresArg: true,
  },
  base: {
    type: 'string',
    alias: 'b',
    describe: 'The base branch to use',
    default: undefined,
    requiresArg: true,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: YargsInstance): YargsInstance {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler (args: Args) {
  const {
    remote: remoteArgument,
    base: baseArgument,
  } = args;

  const remote = findRemote(remoteArgument);

  const isRepositoryDirty = await isDirty();
  if (isRepositoryDirty) {
    await moveUpTop();
    await executeProcessCriticalTasks([
      [ 'git', 'add', '.', '-A' ],
      [ 'git', 'stash' ],
    ]);
  }

  const currentBranchName = await getCurrentBranchName();
  const currentBranch = parseBranchName(currentBranchName);
  const baseBranchName = baseArgument || stringifyBranch(getParentBranch(currentBranch));

  await executeProcessCriticalTasks([
    [ 'git', 'checkout', baseBranchName ],
    [ 'git', 'fetch', remote.name ],
    [ 'git', 'rebase', `${remote.name}/${baseBranchName}` ],
    [ 'git', 'checkout', currentBranchName ],
    [ 'git', 'rebase', baseBranchName ],
  ]);

  if (isRepositoryDirty) {
    await executeProcessCriticalTask([ 'git', 'stash', 'pop' ]);
  }
}
