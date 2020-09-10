import log from '../../dependencies/log.ts';
import { YargsType } from '../../dependencies/yargs.ts';
import { green, bold } from '../../dependencies/colors.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';
import { _isEmpty, _size } from '../../dependencies/lodash.ts';

import { getCommitsFromBaseBranch } from '../../lib/git.ts';

type LogFormatId =
  'pretty'
  | 'simple'
  | 'json'
  | 'sha'

interface Args {
  format?: LogFormatId
  skip?: number
  number?: number
  reverse?: boolean
  fromBaseBranch?: boolean

  // Test thingies
  isTestRun: boolean
}

interface LogFormat {
  formatString: string
  postProcessor?: (wsv: string) => string
}

const DEFAULT_FORMAT = 'pretty';
const WEIRD_SEPARATOR = '$%&'; // FIXME: would've used ✂✌🔪 => but Deno seems to struggle with multi-bytes characters in stdout
const LOG_FORMATS: { [ key: string ]: LogFormat } = {
  pretty: { formatString: '%C(red)%H%C(reset)\n\t%s %C(green)(%cr) %C(bold blue)<%an>%C(reset)\n\t%C(yellow)%d%C(reset)' },
  simple: { formatString: '%C(red)%h%C(reset) %s %C(bold blue)<%an>%C(reset)' },
  json: {
    formatString: `%H${WEIRD_SEPARATOR}%s${WEIRD_SEPARATOR}%an${WEIRD_SEPARATOR}%D`,
    postProcessor (wsv: string) {
      const logObject = wsv.split('\n')
        .map((wsvItem: string) => {
          const [ sha, message, author, branchesAsString ] = wsvItem.split(WEIRD_SEPARATOR);
          const branches = _isEmpty(branchesAsString) ? [] : branchesAsString.replace(/[()]/g, '').split(',');
          return { sha, message, author, branches };
        });
      return JSON.stringify(logObject);
    },
  },
  sha: { formatString: '%H' },
};

export default {
  command: 'history',
  aliases: [ 'h' ],
  describe: 'Displays the commit\'s history',
  install: async () => {
    await log(Deno.stdout, `Installing ${bold('history')} command by adding log formats in ~/.gitconfig `);
    const installFormat = async (formatName: string, formatString: string) =>
      await exec(`git config --global alias.gut-log-${formatName} "log --pretty=format:'${formatString}'"`);

    await installFormat('pretty', `%C(red)%H%C(reset)\n\t%s %C(green)(%cr) %C(bold blue)<%an>%C(reset)\n\t%C(yellow)%d%C(reset)`);
    await installFormat('simple', `%C(red)%h%C(reset) %s %C(bold blue)<%an>%C(reset)`);
    await installFormat('json', `%H$%&%s$%&%an$%&%D`);
    await installFormat('sha', `%H`);
    await log(Deno.stdout, `${green('✔')}\n`);
  },
  builder: (yargs: YargsType) => yargs.usage(`usage: gut history [options]`)
    .option('format', {
      alias: 'f',
      describe: 'The format name. Defaults to pretty',
      choices: [ 'pretty', 'simple', 'json', 'sha' ], // TODO: find how to get that dynamically
      type: 'string',
      default: DEFAULT_FORMAT,
    })
    .option('skip', {
      alias: 's',
      describe: 'Skip n commits before starting to show the commit output',
      type: 'number',
      default: 0,
    })
    .option('number', {
      alias: 'n',
      describe: 'Limit the number of commits to output',
      type: 'number',
      default: 100,
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
    }),
  handler: async (args: Args) => {
    const { format, skip, number, reverse, fromBaseBranch, isTestRun } = args;

    const commitsToInspect = fromBaseBranch
      ? _size(getCommitsFromBaseBranch())
      : number;

    const logFormat = LOG_FORMATS[ format || DEFAULT_FORMAT ];
    const reverseArgument = reverse ? '--reverse' : '';
    const command = `git --no-pager gut-log-${format} --color=always --skip ${skip} -n ${commitsToInspect} ${reverseArgument}"`;

    const outputMode = isTestRun || logFormat.postProcessor
      ? OutputMode.Capture
      : OutputMode.StdOut;

    const { output } = await exec(command, { output: outputMode });
    await log(Deno.stdout, '\n'); // Log command does not end with a line break

    if (outputMode === OutputMode.StdOut) { return ''; }

    const processedOutput: string = logFormat.postProcessor ? logFormat.postProcessor(output) : output;
    if (!isTestRun) {
      await log(Deno.stdout, processedOutput);
    }

    return processedOutput;
  },
};
