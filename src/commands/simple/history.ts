import log from '../../dependencies/log.ts';
import { green, bold } from '../../dependencies/colors.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';

import { getCommitsNumberFromBaseBranch, LogFormat, LOG_FORMATS } from '../../lib/git.ts';

type LogFormatId =
  'pretty'
  | 'simple'
  | 'subject'
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

const DEFAULT_FORMAT = 'pretty';

export default {
  command: 'history',
  aliases: [ 'h' ],
  describe: 'Displays the commit\'s history',
  install: async () => {
    await log(Deno.stdout, `Installing ${bold('history')} command by adding log formats in ~/.gitconfig `);

    await Object.values(LOG_FORMATS)
      .reduce(
        (promise: Promise<void>, { command, format }: LogFormat) =>
          promise.then(async () => {
            await exec(`git config --global alias.${command} "log --pretty=format:'${format}'"`);
          }),
        Promise.resolve(),
      );

    await log(Deno.stdout, `${green('✔')}\n`);
  },
  builder: (yargs: any) => yargs.usage(`usage: gut history [options]`)
    .option('format', {
      alias: 'f',
      describe: 'The format name. Defaults to pretty',
      choices: [ 'pretty', 'simple', 'subject', 'json', 'sha' ], // TODO: find how to get that dynamically
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

    const commitsToInspect = fromBaseBranch ? await getCommitsNumberFromBaseBranch() : number;

    const logFormat = LOG_FORMATS[ format || DEFAULT_FORMAT ];
    const reverseArgument = reverse ? '--reverse' : '';
    const skipArgument = skip ? `--skip ${skip}` : '';
    const numberArgument = commitsToInspect ? `--max-count ${commitsToInspect}` : '';
    const command = `git --no-pager ${logFormat.command} --color=always ${skipArgument} ${numberArgument} ${reverseArgument}`;

    const outputMode = isTestRun || logFormat.postProcessor
      ? OutputMode.Capture
      : OutputMode.StdOut;

    const { output } = await exec(command, { output: outputMode });
    if (outputMode === OutputMode.StdOut) {
      await log(Deno.stdout, '\n'); // Log command does not end with a line break
      return '';
    }

    const processedOutput: string = logFormat.postProcessor ? logFormat.postProcessor(output) : output;
    if (!isTestRun) {
      await log(Deno.stdout, processedOutput);
      await log(Deno.stdout, '\n'); // Log command does not end with a line break
    }

    return processedOutput;
  },
};
