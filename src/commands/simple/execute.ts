import { FullGutConfiguration } from '../../configuration.ts';

import {
  __, applyStyle, theme,
} from '../../dependencies/colors.ts';
import log from '../../dependencies/log.ts';
import { resolve } from '../../dependencies/path.ts';
import { promptSelect } from '../../dependencies/cliffy.ts';

import { EMOJIS } from '../../lib/emojis.ts';
import { editText } from '../../lib/editText.ts';
import { getIssueIdOrEmpty } from '../../lib/branch/getIssueIdOrEmpty.ts';
import { getCommitsUpToMax } from '../../lib/git/getCommitsUpToMax.ts';
import { getCurrentBranchName } from '../../lib/git/getCurrentBranchName.ts';
import { executeAndGetStdout } from '../../lib/exec/executeAndGetStdout.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';

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
const COMMIT_MESSAGE_FILE_NAME = '.gut-commit-message.md';

interface Args {
  codeReview?: boolean,
  wip?: boolean,
  squashOn?: boolean,
  squashOnLast?: boolean,
  configuration: FullGutConfiguration,
}

const commitWithMessage = async (message?: string) => (
  message
    ? executeProcessCriticalTask([ 'git', 'commit', '--message', message ])
    : executeProcessCriticalTask([ 'git', 'commit' ])
);

const commitWithFile = async (filePath: string) => executeAndGetStdout([ 'git', 'commit', '--file', filePath ]);

const commit = async (forgePath: string, emoji: string, suffix: string) => {
  const commitMessageFilePath = resolve(forgePath, COMMIT_MESSAGE_FILE_NAME);
  const paddedEmoji = emoji ? `${emoji} ` : '';
  const paddedSuffix = suffix ? ` ${suffix}` : '';
  await editText({
    fileType: 'markdown',
    startTemplate: `${paddedEmoji}${paddedSuffix}\n`,
    outputFilePath: commitMessageFilePath,
    startIndex: {
      column: paddedEmoji.length + 1,
    },
  });

  return commitWithFile(commitMessageFilePath);
};

const squashCommit = async (shaToSquashOn: string) => {
  await log(Deno.stdout, `Commit to squash on: ${shaToSquashOn}\n`);
  await executeProcessCriticalTask([ 'git', 'commit', '--fixup', shaToSquashOn ]);
  await executeProcessCriticalTask([
    'git', 'rebase', '--interactive', '--autosquash', `${shaToSquashOn}~1`,
  ], { env: { GIT_SEQUENCE_EDITOR: ':' } });
};

const promptForEmoji = async () => promptSelect({
  message: 'Choose your emoji: ',
  options: EMOJIS,
  search: true,
});

export const command = 'execute';
export const aliases = [ 'e' ];
export const describe = 'Commits the staged changes';

const ARG_CODE_REVIEW = 'code-review';
const ARG_WIP = 'wip';
const ARG_SQUASH_ON = 'squash-on';
const ARG_SQUASH_ON_LAST = 'squash-on-last';

const mutuallyExclusiveBooleanArguments = [
  ARG_CODE_REVIEW, ARG_WIP, ARG_SQUASH_ON, ARG_SQUASH_ON_LAST,
];

export function builder (yargs: any) {
  return yargs.usage('usage: gut execute [options]')
    .option(ARG_CODE_REVIEW, {
      alias: 'c',
      describe: `Auto set the message to: ${CODE_REVIEW_MESSAGE.emoji} ${CODE_REVIEW_MESSAGE.message} (if emoji is activated)`,
      type: 'boolean',
    })
    .option(ARG_WIP, {
      alias: 'w',
      describe: `Auto set the message to: ${WIP_MESSAGE.emoji} ${WIP_MESSAGE.message} (if emoji is activated)`,
      type: 'boolean',
    })
    .option(ARG_SQUASH_ON, {
      alias: 's',
      describe: 'Choose a commit in history and squash the staged changes in it',
      type: 'boolean',
    })
    .option(ARG_SQUASH_ON_LAST, {
      alias: 'l',
      describe: 'Squash the changes on the last commit in history',
      type: 'boolean',
    })
    .check((currentArguments: Args) => {
      const errorMessage = mutuallyExclusiveBooleanArguments
        .filter((argumentName) => (
          // @ts-ignore
          currentArguments[ argumentName ]
        ))
        .flatMap((argumentName, index, argumentNames) => (
          argumentNames
            .slice(index + 1)
            .map((otherName) => ([ argumentName, otherName ]))
        ))
        .map(([ firstArgumentName, secondArgumentName ]) => applyStyle(
          __`Arguments ${firstArgumentName} and ${secondArgumentName} are mutually exclusive`,
          [ theme.strong, theme.strong ],
        ))
        .join('\n');

      if (errorMessage) { throw Error(errorMessage); }

      return true;
    });
}

export async function handler (args: Args) {
  const {
    configuration,
    codeReview,
    squashOn,
    squashOnLast,
    wip,
  } = args;

  const shouldUseEmojis = configuration?.repository?.shouldUseEmojis || false;
  const shouldUseIssueNumbers = configuration?.repository?.shouldUseIssueNumbers || false;

  const issueId = shouldUseIssueNumbers ? getIssueIdOrEmpty(await getCurrentBranchName()) : '';
  const suffix = issueId ? `(${issueId})` : '';

  if (wip) {
    const fullMessage = WIP_MESSAGE.getFullMessage(shouldUseEmojis, suffix);
    await commitWithMessage(fullMessage);
    return;
  }

  if (codeReview) {
    const fullMessage = CODE_REVIEW_MESSAGE.getFullMessage(shouldUseEmojis, suffix);
    await commitWithMessage(fullMessage);
    return;
  }

  if (squashOnLast) {
    const [ lastCommit ] = await getCommitsUpToMax(1, false);
    await squashCommit(lastCommit.sha);
    return;
  }

  if (squashOn) {
    const lastCommits = await getCommitsUpToMax(30, false);
    const shaToSquashOn = await promptSelect({
      message: 'Which commit should I squash on',
      options: lastCommits.map(({ subject, sha }) => ({ name: subject, value: sha })),
      search: true,
    });
    await squashCommit(shaToSquashOn);
    return;
  }

  const emoji = shouldUseEmojis ? await promptForEmoji() : '';
  const forgePath = configuration?.global?.forgePath;
  await commit(forgePath, emoji, suffix);
}

export const test = {
  commitWithFile,
  commitWithMessage,
};
