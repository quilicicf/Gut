const _ = require('lodash');

const branches = require('../utils/branches');
const configuration = require('../utils/configuration');
const git = require('../utils/git');
const execution = require('../utils/execution');

module.exports = (() => {
  const CODE_REVIEW_MESSAGE = ':eyes: Code review';

  const ARGUMENTS = {
    MESSAGE: {
      name: 'message',
      alias: 'm',
      describe: 'The message for the commit',
      type: 'array'
    },
    CODE_REVIEW: {
      name: 'code-review',
      alias: 'c',
      describe: `Auto set the message to: ${CODE_REVIEW_MESSAGE.underline}`,
      type: 'boolean'
    }
  };

  return {
    execute: yargs => {
      const args = yargs
        .usage('usage: $0 execute [options]')
        .option(ARGUMENTS.MESSAGE.name, ARGUMENTS.MESSAGE)
        .option(ARGUMENTS.CODE_REVIEW.name, ARGUMENTS.CODE_REVIEW)
        .check(currentArguments => {
          // should be done with conflicts but it always sees code-review as set, which beats the purpose
          if (currentArguments[ ARGUMENTS.MESSAGE.name ] && currentArguments[ ARGUMENTS.CODE_REVIEW.name ]) {
            throw Error('Arguments message and code-review are mutually exclusive!'.red);
          }

          if (!currentArguments[ ARGUMENTS.MESSAGE.name ] && !currentArguments[ ARGUMENTS.CODE_REVIEW.name ]) {
            throw Error('You must specify a commit message!'.red);
          }

          return true;
        })
        .help()
        .argv;

      if (git.hasUnstagedChanges()) {
        execution.print('You have unstaged changes, you should ideally only work on one subject at once!.'.yellow);
      }

      const unsanitizedMessage = _.join(args[ ARGUMENTS.MESSAGE.name ], ' ') || CODE_REVIEW_MESSAGE;
      const message = _.replace(unsanitizedMessage, /'/g, '\\\'');

      const commitMessageSuffixTemplate = configuration.getRepositoryOption(configuration.REPOSITORY_OPTIONS_STRUCTURE.COMMIT_MESSAGE_SUFFIX_TEMPLATE);

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
        execution.print('No commit message suffix template found, no suffix added.');
        execution.print(execution.execute(`git commit -m '${message}'`));
      }
    }
  };
})();
