const _ = require('lodash');

const path = require('path');

const git = require('../../utils/git');
const emojis = require('../../utils/emojis');
const branches = require('../../utils/branches');
const execution = require('../../utils/execution');
const configuration = require('../../utils/configuration');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Commits the staged changes';

const CODE_REVIEW_MESSAGE = ':eyes: Code review';
const WIP_MESSAGE = ':construction: WIP';

const ARG_MESSAGE = {
  name: 'message',
  alias: 'm',
  describe: 'The message for the commit',
  type: 'array',
};

const ARG_CODE_REVIEW = {
  name: 'code-review',
  alias: 'c',
  describe: `Auto set the message to: ${CODE_REVIEW_MESSAGE.underline}`,
  type: 'boolean',
};

const ARG_WIP = {
  name: 'wip',
  alias: 'w',
  describe: `Auto set the message to: ${WIP_MESSAGE.underline}`,
  type: 'boolean',
};

const ARG_EMOJI = {
  name: 'emoji',
  alias: 'e',
  describe: 'Prefix the commit message with an emoji from https://github.com/quilicicf/Docs/blob/master/contribution/main.md',
  type: 'boolean',
};

const QUESTIONS = {
  CHOOSE_EMOJI: 'lib/git/execute:choose_emoji',
};

const QUESTION_EMOJI = {
  type: QUESTION_TYPES.AUTO_COMPLETE,
  id: QUESTIONS.CHOOSE_EMOJI,
  message: 'Choose your emoji: ',
  async source (answers, search = '') {
    return _.reduce(
      emojis,
      (seed, emoji) => {
        const shouldAddEmoji = emoji.value.toLocaleLowerCase().includes(search.toLocaleLowerCase());

        if (!shouldAddEmoji) { return seed; }

        return emoji.value.toLocaleLowerCase() === `:${search.toLocaleLowerCase()}:`
          ? [ emoji, ...seed ]
          : [ ...seed, emoji ];
      },
      [],
    );
  },
  pageSize: 10,
};

const getCommitMessage = (args) => {
  if (args[ ARG_CODE_REVIEW.name ]) {
    return CODE_REVIEW_MESSAGE;
  }

  if (args[ ARG_WIP.name ]) {
    return WIP_MESSAGE;
  }

  return _.join(args[ ARG_MESSAGE.name ], ' ');
};

const createCommitSuffix = (suffixTemplate) => {
  const parsedBranch = branches.parseBranchName();

  if (!parsedBranch.ticketNumber) {
    execution.print('Commit message suffix template found but the branch does not contain a ticket number, no suffix added.'.yellow);
    return undefined;
  }

  return _(suffixTemplate)
    .trim()
    .replace('$ticketNumber', parsedBranch.ticketNumber);
};

const executeArgs = yargs => yargs
  .usage(`usage: gut ${command} [options]`)
  .option(ARG_MESSAGE.name, ARG_MESSAGE)
  .option(ARG_CODE_REVIEW.name, ARG_CODE_REVIEW)
  .option(ARG_WIP.name, ARG_WIP)
  .option(ARG_EMOJI.name, ARG_EMOJI)
  .check((currentArguments) => {
    // should be done with conflicts but it always sees code-review as set, which beats the purpose
    if (currentArguments[ ARG_MESSAGE.name ] && currentArguments[ ARG_CODE_REVIEW.name ]) {
      throw Error(`Arguments message and ${ARG_CODE_REVIEW.name} are mutually exclusive!`.red);
    }

    if (currentArguments[ ARG_MESSAGE.name ] && currentArguments[ ARG_WIP.name ]) {
      throw Error(`Arguments message and ${ARG_WIP.name} are mutually exclusive!`.red);
    }

    if (!currentArguments[ ARG_MESSAGE.name ]
      && !currentArguments[ ARG_CODE_REVIEW.name ]
      && !currentArguments[ ARG_WIP.name ]) {
      throw Error('You must specify a commit message!'.red);
    }

    const isShortcutMessage = currentArguments[ ARG_CODE_REVIEW.name ] || currentArguments[ ARG_WIP.name ];
    if (currentArguments[ ARG_EMOJI.name ] && (isShortcutMessage)) {
      _.set(currentArguments, ARG_EMOJI.name, false);
      _.set(currentArguments, ARG_EMOJI.alias, false);
      process.stdout.write(`Your message already has an emoji, ignoring argument --${ARG_EMOJI.name}.\n`.yellow);
    }

    return true;
  })
  .help();

const executeHandler = async (args) => {
  const { [ ARG_EMOJI.name ]: shouldUseEmoji } = args;

  if (git.hasUnstagedChanges()) {
    execution.print('You have unstaged changes, you should ideally only work on one subject at once!.'.yellow);
  }

  const unsanitizedMessage = getCommitMessage(args);
  const commitMessage = _.replace(unsanitizedMessage, /'/g, '\\\'');

  const commitMessageSuffixTemplate = configuration
    .getRepositoryOptionOrUndefined(configuration.REPOSITORY_OPTIONS_STRUCTURE.COMMIT_MESSAGE_SUFFIX_TEMPLATE);

  if (!commitMessageSuffixTemplate) {
    execution.print('No commit message suffix template found, no suffix added.'.yellow);
  }

  const commitPrefix = shouldUseEmoji ? await ask(QUESTION_EMOJI) : undefined;
  const commitSuffix = commitMessageSuffixTemplate ? createCommitSuffix(commitMessageSuffixTemplate) : undefined;
  const fullMessage = _([ commitPrefix, commitMessage, commitSuffix ])
    .map(part => _.trim(part))
    .filter(part => !_.isEmpty(part))
    .join(' ');

  execution.print(execution.execute(`git commit -m '${fullMessage}'`));
};

module.exports = {
  ARG_CODE_REVIEW,
  ARG_MESSAGE,

  command,
  aliases,
  describe,
  builder: executeArgs,
  handler: executeHandler,
};
