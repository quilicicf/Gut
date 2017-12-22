const _ = require('lodash');

const branches = require('../utils/branches');
const execution = require('../utils/execution');
const prompt = require('../utils/prompt');

module.exports = (() => {
  const ARGUMENTS = {
    TARGET: {
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
    },
    MASTER: {
      name: 'm',
      describe: 'Switch to master',
      type: 'boolean'
    },
    VERSION: {
      name: 'v',
      describe: 'Switch to the version branch',
      type: 'boolean'
    },
    FEATURE: {
      name: 'f',
      describe: 'Switch to feature branch',
      type: 'boolean'
    },
    BASE: {
      name: 'b',
      describe: 'Switch to base branch',
      type: 'boolean'
    }
  };

  return {
    switch: (yargs) => {
      const args = yargs
        .usage('usage: $0 switch [options]')
        .option(ARGUMENTS.TARGET.name, ARGUMENTS.TARGET)
        .option(ARGUMENTS.REGEX.name, ARGUMENTS.REGEX)
        .option(ARGUMENTS.TICKET_NUMBER.name, ARGUMENTS.TICKET_NUMBER)
        .option(ARGUMENTS.MASTER.name, ARGUMENTS.MASTER)
        .option(ARGUMENTS.VERSION.name, ARGUMENTS.VERSION)
        .option(ARGUMENTS.FEATURE.name, ARGUMENTS.FEATURE)
        .option(ARGUMENTS.BASE.name, ARGUMENTS.BASE)
        .check(currentArguments => {
          const argumentsNumber = _(ARGUMENTS)
            .values()
            .map((argument) => currentArguments[ argument.name ])
            .filter((argument) => argument)
            .size();

          if (argumentsNumber === 0) {
            throw Error('You must specify a target branch, either by name, regex, ticket number or shortcut..'.red);
          }

          return true;
        })
        .help()
        .argv;

      const target = args[ ARGUMENTS.TARGET.name ];
      const regex = args[ ARGUMENTS.REGEX.name ];
      const ticketNumber = args[ ARGUMENTS.TICKET_NUMBER.name ];
      const toMaster = args[ ARGUMENTS.MASTER.name ];
      const toVersion = args[ ARGUMENTS.VERSION.name ];
      const toFeature = args[ ARGUMENTS.FEATURE.name ];
      const toBase = args[ ARGUMENTS.BASE.name ];
      const branchDescription = branches.getBranchDescription();

      if (toMaster) {
        execution.execute('git checkout master');

      } else if (toVersion) {
        execution.execute(`git checkout ${branchDescription.version}`);

      } else if (toFeature) {
        try {
          const parsedFeatureBranch = branches.getBranchParent(branchDescription, branches.BRANCH_TYPES.FEATURE);
          execution.execute(`git checkout ${branches.buildBranchName(parsedFeatureBranch)}`);
        } catch (error) {
          execution.exit(1, `Can't find the feature version from ${branches.getCurrentBranchName()}.`);
        }

      } else if (toBase) {
        const parsedBaseBranch = branches.getBranchParent(branchDescription);
        execution.execute(`git checkout ${branches.buildBranchName(parsedBaseBranch)}`);

      } else if (target) {
        execution.execute(`git checkout ${target}`);

      } else {
        const branchRegex = new RegExp(regex || `^[^_]+_${ticketNumber}_`);
        const matchingBranches = branches.searchForLocalBranch(branchRegex);

        if (_.isEmpty(matchingBranches)) {
          execution.print('No branch found matching the regex'.red);

        } else if (matchingBranches.length === 1) {
          execution.execute(`git checkout ${matchingBranches[ 0 ]}`);

        } else {
          prompt.chooseFromList('The following branches matched the search, please choose one:\n', matchingBranches)
            .then((matchingBranch) => {
              execution.execute(`git checkout ${matchingBranch}`);
            });
        }
      }
    }
  };
})();
