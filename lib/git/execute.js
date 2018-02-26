const _ = require('lodash');

const path = require('path');

const branches = require('../utils/branches');
const configuration = require('../utils/configuration');
const git = require('../utils/git');
const execution = require('../utils/execution');

const NAME = path.parse(__filename).name;
const ALIASES = [ NAME.charAt(0) ];
const IDENTIFIERS = _.concat(NAME, ALIASES);
const DESCRIPTION = 'Commits the staged changes';

const CODE_REVIEW_MESSAGE = ':eyes: Code review';

const ARG_MESSAGE = {
  name: 'message',
  alias: 'm',
  describe: 'The message for the commit',
  type: 'array'
};

const ARG_CODE_REVIEW = {
  name: 'code-review',
  alias: 'c',
  describe: `Auto set the message to: ${CODE_REVIEW_MESSAGE.underline}`,
  type: 'boolean'
};

const executeArgs = (yargs) => {
  return yargs
    .usage(`usage: $0 ${NAME} [options]`)
    .option(ARG_MESSAGE.name, ARG_MESSAGE)
    .option(ARG_CODE_REVIEW.name, ARG_CODE_REVIEW)
    .check(currentArguments => {
      // should be done with conflicts but it always sees code-review as set, which beats the purpose
      if (currentArguments[ ARG_MESSAGE.name ] && currentArguments[ ARG_CODE_REVIEW.name ]) {
        throw Error('Arguments message and code-review are mutually exclusive!'.red);
      }

      if (!currentArguments[ ARG_MESSAGE.name ] && !currentArguments[ ARG_CODE_REVIEW.name ]) {
        throw Error('You must specify a commit message!'.red);
      }

      return true;
    })
    .help();
};

const executeCommand = (args) => {
  if (git.hasUnstagedChanges()) {
    execution.print('You have unstaged changes, you should ideally only work on one subject at once!.'.yellow);
  }

  const unsanitizedMessage = _.join(args[ ARG_MESSAGE.name ], ' ') || CODE_REVIEW_MESSAGE;
  const message = _.replace(unsanitizedMessage, /'/g, '\\\'');

  const commitMessageSuffixTemplate = configuration
    .getRepositoryOptionOrUndefined(configuration.REPOSITORY_OPTIONS_STRUCTURE.COMMIT_MESSAGE_SUFFIX_TEMPLATE);

  if (commitMessageSuffixTemplate) {
    const parsedBranch = branches.parseBranchName();

    if (parsedBranch.ticketNumber) {
      const suffix = _(commitMessageSuffixTemplate)
        .replace('$ticketNumber', parsedBranch.ticketNumber);
      const messageWithSuffix = _([ message, suffix ])
        .map(fragment => _.trim(fragment))
        .join(' ');
      execution.print(execution.execute(`git commit -m '${messageWithSuffix}'`));
    } else {
      execution.print('Commit message suffix template found but the branch does not contain a ticket number, no suffix added.'.yellow);
      execution.print(execution.execute(`git commit -m '${message}'`));
    }
  } else {
    execution.print('No commit message suffix template found, no suffix added.'.yellow);
    execution.print(execution.execute(`git commit -m '${message}'`));
  }
};

module.exports = {
  NAME,
  ALIASES,
  IDENTIFIERS,
  DESCRIPTION,

  ARG_CODE_REVIEW,
  ARG_MESSAGE,

  builder: executeArgs,
  command: executeCommand
};
