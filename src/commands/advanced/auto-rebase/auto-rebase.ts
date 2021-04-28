import {
  bindOptionsAndCreateUsage, toYargsUsage, toYargsCommand, ExtraPermissions, YargsOptions,
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
    describe: 'The remote to fetch',
    default: DEFAULT_REMOTE.name,
    requiresArg: true,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: any) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler (args: Args) {
  const { remote: remoteArgument } = args;

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
  const parentBranch = getParentBranch(currentBranch);
  const parentBranchName = stringifyBranch(parentBranch);

  await executeProcessCriticalTasks([
    [ 'git', 'checkout', parentBranchName ],
    [ 'git', 'fetch', remote.name ],
    [ 'git', 'rebase', `${remote.name}/${parentBranchName}` ],
    [ 'git', 'checkout', currentBranchName ],
    [ 'git', 'rebase', parentBranchName ],
  ]);

  if (isRepositoryDirty) {
    await executeProcessCriticalTask([ 'git', 'stash', 'pop' ]);
  }
}
