import log from '../../dependencies/log.ts';

import { LOG_FORMATS, getCommitsFromBaseBranch, getCommitsUpToMax } from '../../lib/git.ts';

interface Args {
  format: string,
  number: number,
  reverse: boolean,
  fromBaseBranch?: boolean,

  // Test thingies
  isTestRun: boolean
}

const DEFAULT_FORMAT = 'pretty';

export const
  command = 'history';
export const aliases = [ 'h' ];
export const describe = 'Displays the commit\'s history';

export function builder (yargs: any) {
  return yargs.usage('usage: gut history [options]')
    .option('format', {
      alias: 'f',
      describe: 'The format name. Defaults to pretty',
      choices: Object.keys(LOG_FORMATS).map((id) => id.toLowerCase()),
      type: 'string',
      default: DEFAULT_FORMAT,
    })
    .option('number', {
      alias: 'n',
      describe: 'Limit the number of commits to output',
      type: 'number',
      default: 10,
    })
    .option('reverse', {
      alias: 'r',
      describe: 'Output the commits chosen to be shown in reverse order.',
      type: 'boolean',
      default: false,
    })
    .option('from-base-branch', {
      alias: 'b',
      describe: 'Audit all commits on top of the base branch',
      type: 'boolean',
    });
}

export async function handler (args: Args) {
  const {
    format, number, reverse, fromBaseBranch, isTestRun,
  } = args;

  const logFormat = LOG_FORMATS[ format.toUpperCase() ];

  if (!logFormat) { throw Error(`Can't find log format ${format}`); } // Can't happen

  const commits = fromBaseBranch
    ? await getCommitsFromBaseBranch(reverse)
    : await getCommitsUpToMax(number, reverse);

  const output = logFormat(commits);

  if (!isTestRun) { await log(Deno.stdout, output.concat('\n')); }
  return commits;
}
