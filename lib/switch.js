module.exports = (() => {
  const _ = require('lodash');

  const utils = require('./utils');

  const ARGUMENTS = {
    TARGET: { // TODO: find a way for it to be the last positional argument
      name: 'target',
      alias: 't',
      describe: 'The target branch',
      type: 'string',
      conflicts: ['regex', 'ticket-number']
    },
    REGEX: {
      name: 'regex',
      alias: 'r',
      describe: 'A regex to find the branch to check out',
      type: 'string',
      conflicts: ['target', 'ticket-number']
    },
    TICKET_NUMBER: {
      name: 'ticket-number',
      alias: 'n',
      describe: 'Specifies the ticket number to switch branches',
      type: 'integer',
      conflicts: ['target', 'regex']
    }
  };

  return {
    switch: (yargs) => {
      const arguments = yargs
        .usage('usage: $0 switch [options]')
        .option(ARGUMENTS.TARGET.name, ARGUMENTS.TARGET)
        .option(ARGUMENTS.REGEX.name, ARGUMENTS.REGEX)
        .option(ARGUMENTS.TICKET_NUMBER.name, ARGUMENTS.TICKET_NUMBER)
        .check(arguments => {
          const argumentsNumber = _([arguments[ARGUMENTS.TARGET.name], arguments[ARGUMENTS.REGEX.name], arguments[ARGUMENTS.TICKET_NUMBER.name]])
            .filter(argument => argument)
            .size();

          if (argumentsNumber === 0) {
            throw Error('You must either specify a target branch, a target regex or a target ticket number.'.red);
          }

          return true;
        })
        .help()
        .argv;

      const target = arguments[ARGUMENTS.TARGET.name];
      const regex = arguments[ARGUMENTS.REGEX.name];
      const ticketNumber = arguments[ARGUMENTS.TICKET_NUMBER.name];
      if (target) {
        utils.execute(`git checkout ${target}`);
      } else {
        const branchRegex = new RegExp(regex || `^[^_]+_${ticketNumber}_`);
        const matchingBranches = utils.searchForLocalBranch(branchRegex);

        if (_.isEmpty(matchingBranches)) {
          utils.print('No branch found matching the regex'.red);
        } else if (matchingBranches.length === 1) {
          utils.execute(`git checkout ${matchingBranches[0]}`);
        } else {
          const matchingBranchesAsString = _.join(matchingBranches, '\n');
          utils.print(`The following branches matched the search, please change it so that there's one match:\n${matchingBranchesAsString}`.red);
        }
      }
    }
  };
})();
