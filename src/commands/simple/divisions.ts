import log from '../../dependencies/log.ts';
import {
  bindOptionsAndCreateUsage,
  ExtraPermissions,
  toYargsCommand,
  toYargsUsage,
  YargsInstance,
  YargsOptions,
} from '../../dependencies/yargs.ts';

import { executeAndGetStdout } from '../../lib/exec/executeAndGetStdout.ts';
import { findRemote } from '../../lib/git/remotes.ts';

const printDivisions = async (remoteArgument?: string): Promise<string> => {
  const baseArgs = [ 'branch', '--color' ];
  const remote = findRemote(remoteArgument || '');
  return executeAndGetStdout(
    'git',
    remoteArgument
      ? [ ...baseArgs, '--remotes', '--list', `${remote.name}/*` ]
      : baseArgs,
    {},
  );
};

export const baseCommand = 'divisions';
export const aliases = [ 'd' ];
export const describe = 'Displays the given remote\'s branches';
export const options: YargsOptions = {
  remote: {
    alias: 'r',
    default: null,
    describe: 'The remote whose branches should be displayed',
    type: 'string',
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler ({ remote, isTestRun }: { remote?: string, isTestRun: boolean }) {
  const divisions = await printDivisions(remote);

  if (isTestRun) { return divisions; }
  await log(Deno.stdout, divisions);
  return divisions;
}

export const test = { printDivisions };
