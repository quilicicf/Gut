import { getCurrentBranchName, getRemotes } from '../../lib/git.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';
import { getBranchRemote } from '../../lib/git/getBranchRemote.ts';

interface Args {
  force: boolean,

  // Test thingies
  isTestRun: boolean,
}

export const command = 'thrust';
export const aliases = [ 't' ];
export const describe = 'Pushes local changes to a remote';

export async function thrust (force: boolean, isTestRun: boolean) {
  const remotes = await getRemotes();
  const remoteOfTrackedBranch = await getBranchRemote();
  const currentBranchName = await getCurrentBranchName();
  const remote = remotes[ 0 ]; // TODO: prompt user when there are multiple remotes

  const forceArg = force ? '--force-with-lease' : '';
  const setUpstreamArg = remoteOfTrackedBranch ? '' : '--set-upstream';
  const targetRemote = remoteOfTrackedBranch || remote;
  const outputMode = isTestRun ? OutputMode.Capture : OutputMode.StdOut;

  return exec(`git push ${forceArg} ${setUpstreamArg} ${targetRemote} ${currentBranchName}`, { output: outputMode });
}

export async function builder (yargs: any) {
  return yargs.usage('usage: gut thrust [options]')
    .option('force', {
      alias: 'f',
      describe: 'Force the push. This erases concurrent server-modifications',
      type: 'boolean',
    });
}

export async function handler ({ force, isTestRun }: Args) {
  return thrust(force, isTestRun);
}

export const test = {};
