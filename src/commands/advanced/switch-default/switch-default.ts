import {
  ExtraPermissions, YargsOptions,
  bindOptionsAndCreateUsage, toYargsCommand, toYargsUsage, YargsInstance,
} from '../../../dependencies/yargs.ts';
import log from '../../../dependencies/log.ts';
import { stoyleGlobal, stoyleString, theme } from '../../../dependencies/stoyle.ts';

import { DEFAULT_REMOTE, findRemote } from '../../../lib/git/remotes.ts';
import { executeAndGetStdout } from '../../../lib/exec/executeAndGetStdout.ts';
import { executeProcessCriticalTask } from '../../../lib/exec/executeProcessCriticalTask.ts';

interface Args {
  remote: string;
}

export const baseCommand = 'switch-default';
export const aliases = [ 'sd' ];
export const describe = 'Fetches the origin\'s default branch, then switches to it';
export const options: YargsOptions = {
  remote: {
    type: 'string',
    describe: 'The remote to check',
    default: DEFAULT_REMOTE.name,
    requiresArg: true,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler (args: Args) {
  const { remote: remoteArgument } = args;

  const remote = findRemote(remoteArgument);

  const defaultBranchLine = await executeAndGetStdout(
    [ 'git', 'remote', 'set-head', remote.name, '--auto' ],
    { shouldTrim: true },
  );

  const [ , defaultBranchName ] = /set to (.*)$/.exec(defaultBranchLine) || [ '', undefined ];

  if (!defaultBranchName) {
    await log(Deno.stderr, stoyleGlobal`Default branch seems off: ${defaultBranchLine}`(theme.error));
    Deno.exit(1);
  }

  const styledDefaultBranchName = stoyleString(defaultBranchName, theme.strong);
  await log(Deno.stdout, `Switching to default branch for remote ${remote.coloredName} -> ${styledDefaultBranchName}\n`);
  await executeProcessCriticalTask([ 'git', 'checkout', defaultBranchName ]);
}
