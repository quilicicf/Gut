import log from '../../dependencies/log.ts';
import { promptConfirm } from '../../dependencies/cliffy.ts';
import {
  bindOptionsAndCreateUsage, toYargsUsage, toYargsCommand, ExtraPermissions, YargsOptions, YargsInstance,
} from '../../dependencies/yargs.ts';

import { getRemotes } from '../../lib/git/getRemotes.ts';
import { getCurrentBranchName } from '../../lib/git/getCurrentBranchName.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';

interface Args {
  noPull: boolean,
  force: boolean,

  // Test thingies
  isTestRun: boolean,
}

const ARG_FORCE = 'force';
const ARG_NO_PULL = 'no-pull';

export const baseCommand = 'yield';
export const aliases = [ 'y' ];
export const describe = 'Fetches from git server';
export const options: YargsOptions = {
  [ ARG_NO_PULL ]: {
    alias: 'p',
    describe: 'Do not pull the changes to the current branch',
    type: 'boolean',
    default: false,
  },
  [ ARG_FORCE ]: {
    alias: 'f',
    describe: 'Whether the pulling of a branch should be forced or not',
    type: 'boolean',
    default: false,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export async function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options)
    .check((args: Args) => {
      if (args.force && !args.noPull) {
        throw Error(`Arguments --${ARG_FORCE} & --${ARG_NO_PULL} are mutually exclusive`);
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
