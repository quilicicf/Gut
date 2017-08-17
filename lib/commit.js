module.exports = (() => {
  const _ = require('lodash');
  const colors = require('colors');
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
          type: 'string'
        })
        .option('code-review', {
          alias: 'c',
          describe: `Auto set the message to: ${CODE_REVIEW_MESSAGE}`,
          type: 'boolean'
        })
        .check(arguments => {
          if (arguments.message && arguments[ 'code-review' ]) {
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
      execSync(`git commit -m '${message}'`);
    }
  };
})
();
