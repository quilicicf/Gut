import log from '../../dependencies/log.ts';
import { resolve } from '../../dependencies/path.ts';
import { promptSelect } from '../../dependencies/cliffy.ts';
import { stoyle, theme } from '../../dependencies/stoyle.ts';
import {
  bindOptionsAndCreateUsage,
  ExtraPermissions,
  toYargsCommand,
  toYargsUsage,
  YargsInstance,
  YargsOptions,
} from '../../dependencies/yargs.ts';

import { EMOJIS, EMOJIS_SELECTION } from '../../lib/emojis.ts';
import { editText } from '../../lib/editText.ts';
import { DEFAULT_MESSAGE_FORMAT, FullGutConfiguration, MessageFormat } from '../../configuration.ts';
import { getIssueIdOrEmpty } from '../../lib/branch/getIssueIdOrEmpty.ts';
import { getCommitsUpToMax } from '../../lib/git/getCommitsUpToMax.ts';
import { getCurrentBranchName } from '../../lib/git/getCurrentBranchName.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';
import { COMMIT_TYPES, COMMIT_TYPES_SELECTION } from '../../lib/commitTypes.ts';

const createCommitTemplate = async (messageFormat: MessageFormat, issueId: string, emoji?: string, commitType?: string): Promise<CommitTemplate> => {
  switch (messageFormat) {
    case 'standard': {
      const suffix: string = issueId ? ` (${issueId})` : '';
      return {
        template: `${suffix}\n`, startIndex: 0,
      };
    }

    case 'emoji': {
      const finalEmoji = emoji || await promptForEmoji();
      const suffix: string = issueId ? ` (${issueId})` : '';
      return {
        template: `${finalEmoji}  ${suffix}\n`,
        startIndex: finalEmoji.length + 1,
      };
    }

    case 'angular': {
      const finalCommitType = commitType || await promptForCommitType();
      const commitTopic = issueId ? `(${issueId})` : '';
      return {
        template: `${finalCommitType}${commitTopic}: \n`,
        startIndex: finalCommitType.length + commitTopic.length + 2,
      };
    }

    default:
      throw Error(`Unsupported message format ${messageFormat}`);
  }
};

const createCommitMessage = async (messageFormat: MessageFormat, issueId: string, commit: Commit): Promise<string> => {
  const { template, startIndex } = await createCommitTemplate(messageFormat, issueId, commit.emoji, commit.type);
  return `${template.substring(0, startIndex)}${commit.message.trim()}${template.substring(startIndex)}`;
};

interface CommitTemplate {
  template: string;
  startIndex: number;
}

interface Commit {
  emoji: string;
  message: string;
  type: string;
}

const WIP_COMMIT: Commit = {
  message: 'WIP',
  emoji: EMOJIS.CONSTRUCTION.value,
  type: COMMIT_TYPES.CHORE.value,
};
const CODE_REVIEW_COMMIT: Commit = {
  message: 'Code review',
  emoji: EMOJIS.EYES.value,
  type: COMMIT_TYPES.CHORE.value,
};
const COMMIT_MESSAGE_FILE_NAME = 'commit-message.md';

interface Args {
  codeReview?: boolean,
  wip?: boolean,
  squashOn?: boolean,
  squashOnLast?: boolean,
  configuration: FullGutConfiguration,
}

const commitWithMessage = async (message?: string) => (
  message
    ? executeProcessCriticalTask('git', [ 'commit', '--message', message ])
    : executeProcessCriticalTask('git', [ 'commit' ])
);

const commitWithFile = async (filePath: string) => executeProcessCriticalTask('git', [ 'commit', '--file', filePath ]);

const commit = async (tempFolderPath: string, messageFormat: MessageFormat, issueId: string) => {
  const commitMessageFilePath = resolve(tempFolderPath, COMMIT_MESSAGE_FILE_NAME);
  const commitTemplate: CommitTemplate = await createCommitTemplate(messageFormat, issueId);
  await editText({
    fileType: 'markdown',
    startTemplate: commitTemplate.template,
    outputFilePath: commitMessageFilePath,
    startIndex: {
      column: commitTemplate.startIndex + 1,
    },
  });

  return commitWithFile(commitMessageFilePath);
};

const squashCommit = async (shaToSquashOn: string) => {
  await log(Deno.stdout, `Commit to squash on: ${shaToSquashOn}\n`);
  await executeProcessCriticalTask('git', [ 'commit', '--fixup', shaToSquashOn ]);
  await executeProcessCriticalTask(
    'git',
    [ 'rebase', '--interactive', '--autosquash', `${shaToSquashOn}~1` ],
    { env: { GIT_SEQUENCE_EDITOR: ':' } },
  );
};

const promptForEmoji = async () => promptSelect({
  message: 'Choose your emoji: ',
  options: EMOJIS_SELECTION,
  search: true,
});

const promptForCommitType = async () => promptSelect({
  message: 'Choose the type of commit: ',
  options: COMMIT_TYPES_SELECTION,
  search: true,
});

const ARG_CODE_REVIEW = 'code-review';
const ARG_WIP = 'wip';
const ARG_SQUASH_ON = 'squash-on';
const ARG_SQUASH_ON_LAST = 'squash-on-last';

const mutuallyExclusiveBooleanArguments = [
  ARG_CODE_REVIEW, ARG_WIP, ARG_SQUASH_ON, ARG_SQUASH_ON_LAST,
];

export const baseCommand = 'execute';
export const aliases = [ 'e' ];
export const describe = 'Commits the staged changes';
export const options: YargsOptions = {
  [ ARG_CODE_REVIEW ]: {
    alias: 'c',
    describe: `Auto set the message to: ${CODE_REVIEW_COMMIT.message}`,
    type: 'boolean',
  },
  [ ARG_WIP ]: {
    alias: 'w',
    describe: `Auto set the message to: ${WIP_COMMIT.message}`,
    type: 'boolean',
  },
  [ ARG_SQUASH_ON ]: {
    alias: 's',
    describe: 'Choose a commit in history and squash the staged changes in it',
    type: 'boolean',
  },
  [ ARG_SQUASH_ON_LAST ]: {
    alias: 'l',
    describe: 'Squash the changes on the last commit in history',
    type: 'boolean',
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(command, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options)
    .check((currentArguments: Args) => {
      const errorMessage = mutuallyExclusiveBooleanArguments
        .filter((argumentName) => (
          // @ts-ignore The arguments are all in Args
          currentArguments[ argumentName ]
        ))
        .flatMap((argumentName, index, argumentNames) => (
          argumentNames
            .slice(index + 1)
            .map((otherName) => ([ argumentName, otherName ]))
        ))
        .map(([ firstArgumentName, secondArgumentName ]) => (
          stoyle`Arguments ${firstArgumentName} and ${secondArgumentName} are mutually exclusive`(
            { nodes: [ theme.strong, theme.strong ] },
          )))
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

  const messageFormat: MessageFormat = configuration?.repository?.messageFormat || DEFAULT_MESSAGE_FORMAT;
  const shouldUseIssueNumbers = configuration?.repository?.shouldUseIssueNumbers || false;

  const issueId = shouldUseIssueNumbers ? getIssueIdOrEmpty(await getCurrentBranchName()) : '';

  if (wip) {
    const fullMessage = await createCommitMessage(messageFormat, issueId, WIP_COMMIT);
    await commitWithMessage(fullMessage);
    return;
  }

  if (codeReview) {
    const fullMessage = await createCommitMessage(messageFormat, issueId, CODE_REVIEW_COMMIT);
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

  const tempFolderPath = configuration?.global?.tempFolderPath;
  await commit(tempFolderPath, messageFormat, issueId);
}

export const test = {
  commitWithFile,
  commitWithMessage,
};
