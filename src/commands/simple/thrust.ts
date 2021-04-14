import { bindOptionsAndCreateUsage, toYargsUsage, YargsOptions } from '../../dependencies/yargs.ts';

import { getBranchRemote } from '../../lib/git/getBranchRemote.ts';
import { getRemotes } from '../../lib/git/getRemotes.ts';
import { getCurrentBranchName } from '../../lib/git/getCurrentBranchName.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';

interface Args {
  force: boolean,
}

export const command = 'thrust';
export const aliases = [ 't' ];
export const describe = 'Pushes local changes to a remote';
export const options: YargsOptions = {
  force: {
    alias: 'f',
    describe: 'Force the push. This erases concurrent server-modifications',
    type: 'boolean',
  },
};
export const usage = toYargsUsage(command, options);

export async function thrust (force: boolean) {
  const remotes = await getRemotes();
  const remoteOfTrackedBranch = await getBranchRemote();
  const currentBranchName = await getCurrentBranchName();
  const remote = remotes[ 0 ]; // TODO: prompt user when there are multiple remotes

  const forceArg = force ? [ '--force-with-lease' ] : [];
  const setUpstreamArg = remoteOfTrackedBranch ? [] : [ '--set-upstream' ];
  const targetRemote = remoteOfTrackedBranch || remote;

  return executeProcessCriticalTask([
    'git', 'push', ...forceArg, ...setUpstreamArg, targetRemote, currentBranchName,
  ]);
}

export async function builder (yargs: any) {
  return bindOptionsAndCreateUsage(yargs, command, usage, options);
}

export async function handler ({ force }: Args) {
  return thrust(force);
}

export const test = {};
