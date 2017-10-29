const _ = require('lodash');

const branches = require('../utils/branches');
const execution = require('../utils/execution');

module.exports = (() => {
  const ARGUMENTS = {
    TARGET: { // TODO: find a way for it to be the last positional argument
      name: 'target',
      alias: 't',
      describe: 'The target branch',
      type: 'string',
      conflicts: [ 'regex', 'ticket-number' ]
    },
    REGEX: {
      name: 'regex',
      alias: 'r',
      describe: 'A regex to find the branch to check out',
      type: 'string',
      conflicts: [ 'target', 'ticket-number' ]
    },
    TICKET_NUMBER: {
      name: 'ticket-number',
      alias: 'n',
      describe: 'Specifies the ticket number to switch branches',
      type: 'integer',
      conflicts: [ 'target', 'regex' ]
    }
  };

  return {
    switch: (yargs) => {
      const args = yargs
        .usage('usage: $0 switch [options]')
        .option(ARGUMENTS.TARGET.name, ARGUMENTS.TARGET)
        .option(ARGUMENTS.REGEX.name, ARGUMENTS.REGEX)
        .option(ARGUMENTS.TICKET_NUMBER.name, ARGUMENTS.TICKET_NUMBER)
        .check(currentArguments => {
          const target = currentArguments[ ARGUMENTS.TARGET.name ];
          const regex = currentArguments[ ARGUMENTS.REGEX.name ];
          const commitsNumber = currentArguments[ ARGUMENTS.TICKET_NUMBER.name ];

          const argumentsNumber = _([ target, regex, commitsNumber ])
            .filter(argument => argument)
            .size();

          if (argumentsNumber === 0) {
            throw Error('You must either specify a target branch, a target regex or a target ticket number.'.red);
          }

          return true;
        })
        .help()
        .argv;

      const target = args[ ARGUMENTS.TARGET.name ];
      const regex = args[ ARGUMENTS.REGEX.name ];
      const ticketNumber = args[ ARGUMENTS.TICKET_NUMBER.name ];
      if (target) {
        execution.execute(`git checkout ${target}`);
      } else {
        const branchRegex = new RegExp(regex || `^[^_]+_${ticketNumber}_`);
        const matchingBranches = branches.searchForLocalBranch(branchRegex);

        if (_.isEmpty(matchingBranches)) {
          execution.print('No branch found matching the regex'.red);
        } else if (matchingBranches.length === 1) {
          execution.execute(`git checkout ${matchingBranches[ 0 ]}`);
        } else {
          const matchingBranchesAsString = _.join(matchingBranches, '\n');
          execution.print(`The following branches matched the search, please change it so that there's one match:\n${matchingBranchesAsString}`.red);
        }
      }
    }
  };
})();
