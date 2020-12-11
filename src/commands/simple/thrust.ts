import { getCurrentBranchName, getRemotes } from '../../lib/git.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';

interface Args {
  force: boolean,

  // Test thingies
  isTestRun: boolean,
}

export const command = 'thrust';
export const aliases = [ 't' ];
export const describe = 'Pushes local changes to a remote';

export async function builder (yargs: any) {
  return yargs.usage('usage: gut thrust [options]')
    .option('force', {
      alias: 'f',
      describe: 'Force the push. This erases concurrent server-modifications', // TODO: implement safety net
      type: 'boolean',
    });
}

export async function handler ({ force, isTestRun }: Args) {
  const remotes = await getRemotes();
  const currentBranchName = await getCurrentBranchName();
  const remote = remotes[ 0 ]; // TODO: prompt user when there are multiple remotes

  const forceArg = force ? '--force' : '';
  const outputMode = isTestRun ? OutputMode.Capture : OutputMode.StdOut;
  return exec(`git push ${forceArg} --set-upstream ${remote} ${currentBranchName}`, { output: outputMode });
}

export const test = {};
