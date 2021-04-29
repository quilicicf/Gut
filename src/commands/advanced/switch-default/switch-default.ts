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
import { executeAndGetStdout } from '../../../lib/exec/executeAndGetStdout.ts';
import log from '../../../dependencies/log.ts';
import { applyStyle, theme } from '../../../dependencies/colors.ts';
import apply = Reflect.apply;

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

export function builder (yargs: any) {
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
    await log(Deno.stderr, applyStyle(`Default branch seems off: ${defaultBranchLine}`, [ theme.error ]));
    Deno.exit(1);
  }

  const styledDefaultBranchName = applyStyle(defaultBranchName, [ theme.strong ]);
  await log(Deno.stdout, `Switching to default branch for remote ${remote.coloredName} -> ${styledDefaultBranchName}\n`);
  await executeProcessCriticalTask([ 'git', 'checkout', defaultBranchName ]);
}
