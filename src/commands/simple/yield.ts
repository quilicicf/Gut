import { getCurrentBranchName, getRemotes } from '../../lib/git.ts';

import log from '../../dependencies/log.ts';
import { promptConfirm } from '../../dependencies/cliffy.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';

interface Args {
  noPull: boolean,
  force: boolean,

  // Test thingies
  isTestRun: boolean,
}

export const command = 'yield';
export const aliases = [ 'y' ];
export const describe = 'Fetches from git server';

export async function builder (yargs: any) {
  const forceArgument = 'force';
  const noPullArgument = 'no-pull';
  return yargs.usage(`usage: gut ${command} [options]`)
    .option(noPullArgument, {
      alias: 'p',
      describe: 'Do not pull the changes to the current branch',
      type: 'boolean',
      default: false,
    })
    .option(forceArgument, {
      alias: 'f',
      describe: 'Whether the pulling of a branch should be forced or not',
      type: 'boolean',
      default: false,
    })
    .check((args: Args) => {
      if (args.force && !args.noPull) {
        throw Error(`Arguments --${forceArgument} & --${noPullArgument} are mutually exclusive`);
      }

      return true;
    });
}

export async function handler (args: Args) {
  const { noPull, force } = args;

  const remotes = await getRemotes();
  const currentBranchName = await getCurrentBranchName();
  const remote = remotes[ 0 ]; // TODO: prompt user when there are multiple remotes

  await log(Deno.stdout, `Fetching ${remote}\n`);
  await executeProcessCriticalTask([ 'git', 'fetch', remote ]);

  if (noPull) { return; }

  if (force) {
    const shouldForcePull = await promptConfirm({
      message: 'Do you want to overwrite your local branch ?',
      default: false,
    });

    if (!shouldForcePull) {
      await log(Deno.stdout, 'Operation aborted');
      return;
    }
    await executeProcessCriticalTask([ 'git', 'reset', '--hard', `${remote}/${currentBranchName}` ]);
    return;
  }

  await executeProcessCriticalTask([ 'git', 'rebase', `${remote}/${currentBranchName}` ]);
}

export const test = {};
