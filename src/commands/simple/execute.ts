import { editFile } from '../../lib/editor.ts';
import { FullGutConfiguration } from '../../configuration.ts';

import {
  __, applyStyle, theme,
} from '../../dependencies/colors.ts';
import { resolve } from '../../dependencies/path.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';

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

interface Args {
  codeReview?: boolean,
  wip?: boolean,
  squashOn?: boolean,
  configuration: FullGutConfiguration,

  // Test thingies
  isTestRun: boolean
}

const commit = async (message: string, isTestRun: boolean) => {
  const output = isTestRun ? OutputMode.Capture : OutputMode.StdOut;
  return exec(`git commit --message '${message}'`, { output });
};

const commitFromFile = async (filePath: string, isTestRun: boolean) => {
  const output = isTestRun ? OutputMode.Capture : OutputMode.StdOut;
  return exec(`git commit --file ${filePath}`, { output });
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

  if (wip) {
    const fullMessage = WIP_MESSAGE.getFullMessage(shouldUseEmojis, '');
    return commit(fullMessage, isTestRun);
  }

  if (codeReview) {
    const fullMessage = CODE_REVIEW_MESSAGE.getFullMessage(shouldUseEmojis, '');
    return commit(fullMessage, isTestRun);
  }

  const editor = configuration?.global?.editor;
  const forge = configuration?.global?.repositoriesPath;
  const filePath = resolve(forge, '.commit-message.md');
  await editFile(editor, filePath);
  return commitFromFile(filePath, isTestRun);
}

export const test = {};
