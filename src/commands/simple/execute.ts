import { FullGutConfiguration } from '../../configuration.ts';

import {
  __, applyStyle, theme,
} from '../../dependencies/colors.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';
import { promptSelect } from '../../dependencies/cliffy.ts';

import { EMOJIS } from '../../lib/emojis.ts';
import { getIssueIdOrEmpty } from '../../lib/branch.ts';
import { getCurrentBranchName } from '../../lib/git.ts';

class CommitMessage {
  message: string;

  emoji: string;

  constructor (message: string, emoji: string) {
    this.message = message;
    this.emoji = emoji;
  }

  getFullMessage (shouldUseEmojis: boolean, suffix: string) {
    return shouldUseEmojis
      ? `${this.emoji} ${this.message} ${suffix}`
      : `${this.message} ${suffix}`;
  }
}

const CODE_REVIEW_MESSAGE = new CommitMessage('Code review', ':eyes:');
const WIP_MESSAGE = new CommitMessage('WIP', ':construction:');
const DUMMY_COMMIT_MESSAGE = 'Dummy commit message';

interface Args {
  codeReview?: boolean,
  wip?: boolean,
  squashOn?: boolean,
  configuration: FullGutConfiguration,

  // Test thingies
  isTestRun: boolean
}

const commitWithMessage = async (isTestRun: boolean, message: string) => {
  const output = isTestRun ? OutputMode.Capture : OutputMode.StdOut;
  return message
    ? exec(`git commit --message '${message}'`, { output })
    : exec('git commit', { output });
};

const commit = async (isTestRun: boolean, forgePath: string, emoji: string, suffix: string) => {

  return isTestRun
    ? exec(`git commit --message '${emoji} ${DUMMY_COMMIT_MESSAGE} ${suffix}'`, { output: OutputMode.Capture })
    : exec('git commit', { output: OutputMode.StdOut });
};

const promptForEmoji = async () => {
  return promptSelect({
    message: 'Choose your emoji: ',
    options: EMOJIS,
    search: true,
  });
};

export const command = 'execute';
export const aliases = [ 'e' ];
export const describe = 'Commits the staged changes';

export function builder (yargs: any) {
  return yargs.usage('usage: gut execute [options]')
    .option('code-review', {
      alias: 'c',
      describe: `Auto set the message to: ${CODE_REVIEW_MESSAGE.emoji} ${CODE_REVIEW_MESSAGE.message} (if emoji is activated)`,
      type: 'boolean',
    })
    .option('wip', {
      alias: 'w',
      describe: `Auto set the message to: ${WIP_MESSAGE.emoji} ${WIP_MESSAGE.message} (if emoji is activated)`,
      type: 'boolean',
    })
    .option('squash-on', {
      alias: 's',
      describe: 'Choose a commit in history and squash the staged changes in it',
      type: 'boolean',
    })
    .check((currentArguments: Args) => {
      if (currentArguments.squashOn && currentArguments.codeReview) {
        throw Error(applyStyle(
          __`Arguments ${'squash-on'} and ${'code-review'} are incompatible`,
          [ theme.strong, theme.strong ],
        ));
      }

      if (currentArguments.squashOn && currentArguments.wip) {
        throw Error(applyStyle(
          __`Arguments ${'squash-on'} and ${'wip'} are incompatible`,
          [ theme.strong, theme.strong ],
        ));
      }

      return true;
    });
}

export async function handler (args: Args) {
  const {
    configuration,
    codeReview,
    wip,
    isTestRun,
  } = args;

  const shouldUseEmojis = configuration?.repository?.shouldUseEmojis || false;
  const shouldUseIssueNumbers = configuration?.repository?.shouldUseIssueNumbers || false;

  const issueId = shouldUseIssueNumbers ? getIssueIdOrEmpty(await getCurrentBranchName()) : '';
  const suffix = issueId ? `(${issueId})` : '';

  if (wip) {
    const fullMessage = WIP_MESSAGE.getFullMessage(shouldUseEmojis, suffix);
    return commitWithMessage(isTestRun, fullMessage);
  }

  if (codeReview) {
    const fullMessage = CODE_REVIEW_MESSAGE.getFullMessage(shouldUseEmojis, suffix);
    return commitWithMessage(isTestRun, fullMessage);
  }

  const emoji = shouldUseEmojis
    ? await promptForEmoji()
    : '';

  const forgePath = configuration?.global?.forgePath;
  return commit(isTestRun, forgePath, emoji, suffix);
}

export const test = {
  DUMMY_COMMIT_MESSAGE,
};
