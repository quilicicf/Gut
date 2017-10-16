module.exports = (() => {
  const _ = require('lodash');

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
      const arguments = yargs
        .usage('usage: $0 execute [options]')
        .option(ARGUMENTS.MESSAGE.name, ARGUMENTS.MESSAGE)
        .option(ARGUMENTS.CODE_REVIEW.name, ARGUMENTS.CODE_REVIEW)
        .check(arguments => {
          // should be done with conflicts but it always sees code-review as set, which beats the purpose
          if (arguments[ ARGUMENTS.MESSAGE.name ] && arguments[ ARGUMENTS.CODE_REVIEW.name ]) {
            throw Error('Arguments message and code-review are mutually exclusive!'.red);
          }

          if (!arguments[ ARGUMENTS.MESSAGE.name ] && !arguments[ ARGUMENTS.CODE_REVIEW.name ]) {
            throw Error('You must specify a commit message!'.red);
          }

          return true;
        })
        .help()
        .argv;

      if (utils.hasUnstagedChanges()) {
        utils.print('You have unstaged changes, you should ideally only work on one subject at once!.'.yellow);
      }

      const unsanitizedMessage = _.join(arguments[ ARGUMENTS.MESSAGE.name ], ' ') || CODE_REVIEW_MESSAGE;
      const message = _.replace(unsanitizedMessage, /'/g, '\\\'');

      const commitMessageSuffixTemplate = utils.getRepositoryOption('commitMessageSuffixTemplate');

      if (commitMessageSuffixTemplate) {
        const parsedBranch = utils.parseBranchName();

        if (parsedBranch.ticketNumber) {
          const suffix = _(commitMessageSuffixTemplate)
            .replace('$ticketNumber', parsedBranch.ticketNumber);
          const messageWithSuffix = _([ message, suffix ])
            .map(fragment => _.trim(fragment))
            .join(' ');
          utils.print(utils.execute(`git commit -m '${messageWithSuffix}'`));
        } else {
          utils.print('Commit message suffix template found but the branch does not contain a ticket number, no suffix added.'.yellow);
          utils.print(utils.execute(`git commit -m '${message}'`));
        }
      } else {
        utils.print('No commit message suffix template found, no suffix added.');
        utils.print(utils.execute(`git commit -m '${message}'`));
      }
    }
  };
})();
