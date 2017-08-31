module.exports = (() => {
  require('colors');
  const _ = require('lodash');
  const execSync = require('child_process').execSync;

  const utils = require('./utils');


  const CODE_REVIEW_MESSAGE = `:eyes: Code review`;

  return {
    commit: yargs => {
      const arguments = yargs
        .usage('usage: $0 commit [options]')
        .option('message', {
          alias: 'm',
          describe: 'The message for the commit',
          type: 'string',
          conflicts: 'code-review'
        })
        .option('code-review', {
          alias: 'c',
          describe: `Auto set the message to: ${CODE_REVIEW_MESSAGE}`,
          type: 'boolean',
          conflicts: 'code-review'
        })
        .check(arguments => {
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
          execSync(`git commit -m '${messageWithSuffix}'`);

        } else {
          console.log(`Commit message suffix template found but the branch does not contain a ticket number, no suffix added.`.yellow);
          execSync(`git commit -m '${message}'`);
        }

      } else {
        console.log(`No commit message suffix template found, no suffix added.`);
        execSync(`git commit -m '${message}'`);
      }
    }
  };
})
();
