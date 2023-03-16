import log from '../../dependencies/log.ts';
import {
  bindOptionsAndCreateUsage,
  ExtraPermissions,
  toYargsCommand,
  toYargsUsage,
  YargsInstance,
  YargsOptions,
} from '../../dependencies/yargs.ts';

import { LOG_FORMATS } from '../../lib/git/logFormats.ts';
import { getCommitsUpToMax } from '../../lib/git/getCommitsUpToMax.ts';
import { getCommitsFromParentBranch } from '../../lib/git/getCommitsFromParentBranch.ts';

interface Args {
  format: string,
  number: number,
  reverse: boolean,
  fromParentBranch?: boolean,
  fromOtherRef?: string,
}

const DEFAULT_FORMAT = 'pretty';

export const baseCommand = 'history';
export const aliases = [ 'h' ];
export const describe = 'Displays the commit history';

export const ARG_FROM_PARENT_BRANCH = 'from-parent-branch';
export const ARG_FROM_OTHER_BRANCH = 'from-other-branch';
export const options: YargsOptions = {
  format: {
    alias: 'f',
    describe: 'The format name. Defaults to pretty',
    choices: Object.keys(LOG_FORMATS).map((id) => id.toLowerCase()),
    type: 'string',
    default: DEFAULT_FORMAT,
  },
  number: {
    alias: 'n',
    describe: 'Limit the number of commits to output',
    type: 'number',
    default: 10,
  },
  reverse: {
    alias: 'r',
    describe: 'Output the commits chosen to be shown in reverse order.',
    type: 'boolean',
    default: false,
  },
  [ ARG_FROM_PARENT_BRANCH ]: {
    alias: 'p',
    describe: 'Audit all commits on top of the parent branch',
    type: 'boolean',
    conflicts: ARG_FROM_OTHER_BRANCH,
  },
  [ ARG_FROM_OTHER_BRANCH ]: {
    alias: 'o',
    describe: 'Audit all commits on top of the provided branch',
    type: 'string',
    conflicts: ARG_FROM_PARENT_BRANCH,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler (args: Args) {
  const {
    format, number, reverse, fromParentBranch,
  } = args;

  const logFormat = LOG_FORMATS[ format.toUpperCase() ];

  if (!logFormat) { throw Error(`Can't find log format ${format}`); } // Can't happen

  const commits = fromParentBranch
    ? await getCommitsFromParentBranch(reverse)
    : await getCommitsUpToMax(number, reverse);

  const output = logFormat(commits);

  await log(Deno.stdout, output.concat('\n'));
  return commits;
}
