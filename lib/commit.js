module.exports = (() => {
  require('colors');
  const _ = require('lodash');

  const utils = require('./utils');


  const CODE_REVIEW_MESSAGE = `:eyes: Code review`;

  return {
    commit: yargs => {
      const arguments = yargs
        .usage('usage: $0 commit [options]')
        .option('message', {
          alias: 'm',
          describe: 'The message for the commit',
          type: 'string'
        })
        .option('code-review', {
          alias: 'c',
          describe: `Auto set the message to: ${CODE_REVIEW_MESSAGE}`,
          type: 'boolean'
        })
        .check(arguments => {
          if (arguments.message && arguments[ 'code-review' ]) { // should be done with conflicts but it always sees code-review as set, which beats the purpose
            throw Error('Arguments message and code-review are mutually exclusive!'.red);
          }

          if (!arguments.message && !arguments[ 'code-review' ]) {
            throw Error('You must specify a commit message!'.red);
          }

          return true;
        })
        .help()
        .argv;

      if (utils.hasUnstagedChanges()) {
        throw Error(`You have unstaged changes, please add them first.`.red);
      }

      const unsanitizedMessage = arguments.message || CODE_REVIEW_MESSAGE;
      const message = _.replace(unsanitizedMessage, /'/g, `\\'`);

      const commitMessageSuffixTemplate = utils.getRepositoryOption('commitMessageSuffixTemplate');

      if (commitMessageSuffixTemplate) {
        const parsedBranch = utils.parseBranchName();

        if (parsedBranch.ticketNumber) {
          const suffix = _(commitMessageSuffixTemplate)
            .replace('$ticketNumber', parsedBranch.ticketNumber);
          const messageWithSuffix = _([ message, suffix ])
            .map(fragment => _.trim(fragment))
            .join(' ');
          utils.log(utils.execute(`git commit -m '${messageWithSuffix}'`));

        } else {
          utils.log(`Commit message suffix template found but the branch does not contain a ticket number, no suffix added.`.yellow);
          utils.log(utils.execute(`git commit -m '${message}'`));
        }

      } else {
        utils.log(`No commit message suffix template found, no suffix added.`);
        utils.log(utils.execute(`git commit -m '${message}'`));
      }
    }
  };
})
();
