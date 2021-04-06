import log from '../../dependencies/log.ts';

import { LOG_FORMATS } from '../../lib/git/logFormats.ts';
import { getCommitsUpToMax } from '../../lib/git/getCommitsUpToMax.ts';
import { getCommitsFromParentBranch } from '../../lib/git/getCommitsFromParentBranch.ts';

interface Args {
  format: string,
  number: number,
  reverse: boolean,
  fromParentBranch?: boolean,
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
    .option('from-parent-branch', {
      alias: 'p',
      describe: 'Audit all commits on top of the parent branch',
      type: 'boolean',
    });
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
