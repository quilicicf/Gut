const _ = require('lodash');

const configure = require('./configure');

const branches = require('../utils/branches');
const execution = require('../utils/execution');

module.exports = (() => {
  const ARGUMENTS = {
    NEW_VERSION_BRANCH: {
      name: 'version',
      alias: 'v',
      describe: 'Version to use to create a new version branch',
      type: 'string'
    },
    NEW_FEATURE_BRANCH: {
      name: 'feature',
      alias: 'f',
      describe: 'Feature to use to create a new feature branch',
      type: 'string'
    },
    NEW_DEV_BRANCH: {
      name: 'dev',
      alias: 'd',
      describe: 'Description to use to create a new dev branch',
      type: 'string'
    },
    TICKET_NUMBER: {
      name: 'ticket-number',
      alias: 'n',
      describe: 'Specifies the ticket number when creating a new branch',
      type: 'integer'
    },
    IS_BUILDABLE: {
      name: 'buildable',
      alias: 'b',
      describe: 'Specifies if the new branch should be buildable (only available on feature branches)',
      type: 'boolean'
    }
  };

  const createBranch = (newParsedBranch, gutOptions) => {
    const newBranchDescription = _.cloneDeep(newParsedBranch);
    newBranchDescription.author = gutOptions.accounts.github.username; // TODO: change when adding new git servers
    newBranchDescription.baseBranch = branches.getCurrentBranchName();

    const newBranchName = branches.buildBranchName(newBranchDescription);

    execution.execute([
      `git checkout -b ${newBranchName}`,
      `git config branch.${newBranchName}.description '${JSON.stringify(newBranchDescription)}'`
    ]);
  };

  const createVersionBranch = (parsedBranch, args, gutOptions) => {
    const newVersion = args[ ARGUMENTS.NEW_VERSION_BRANCH.name ];
    if (!branches.isMasterBranch(parsedBranch)) {
      throw Error('It is only allowed to create version branches from master!'.red);
    }

    const newParsedBranch = _.cloneDeep(parsedBranch);
    newParsedBranch.version = newVersion;
    newParsedBranch.type = branches.BRANCH_TYPES.VERSION.name;

    createBranch(newParsedBranch, gutOptions);
  };

  const createFeatureBranch = (parsedBranch, args, gutOptions) => {
    const newFeature = args[ ARGUMENTS.NEW_FEATURE_BRANCH.name ];
    const isBuildable = args[ ARGUMENTS.IS_BUILDABLE.name ];
    if (!branches.isMasterBranch(parsedBranch) && !branches.isVersionBranch(parsedBranch)) {
      throw Error('It is only allowed to create feature branches from version branches or master!'.red);
    }

    const newParsedBranch = _.cloneDeep(parsedBranch);
    newParsedBranch.feature = newFeature;
    newParsedBranch.isBuildable = isBuildable;
    newParsedBranch.type = branches.BRANCH_TYPES.FEATURE.name;

    createBranch(newParsedBranch, gutOptions);
  };

  const createDevBranch = (parsedBranch, args, gutOptions) => {
    const newDescription = args[ ARGUMENTS.NEW_DEV_BRANCH.name ];
    const newTicketNumber = args[ ARGUMENTS.TICKET_NUMBER.name ] || '';
    if (!branches.isVersionBranch(parsedBranch) && !branches.isFeatureBranch(parsedBranch)) {
      throw Error('It is only allowed to create dev branches from version or feature branches!'.red);
    }

    const newParsedBranch = _.cloneDeep(parsedBranch);
    newParsedBranch.ticketNumber = newTicketNumber;
    newParsedBranch.description = newDescription;
    newParsedBranch.type = branches.BRANCH_TYPES.DEV.name;

    createBranch(newParsedBranch, gutOptions);
  };

  const hasNoneOf = (forbiddenCharacters, argument, argumentName) => {
    const hasForbiddenCharacters = _.some(
      forbiddenCharacters,
      forbiddenCharacter => argument.includes(forbiddenCharacter)
    );
    if (hasForbiddenCharacters) {
      const forbiddenCharactersAsString = _.map(forbiddenCharacters, char => `'${char}'`); // TODO: stringification via lodash ?
      throw Error(`Argument ${argumentName} can't contain any of these characters [ ${forbiddenCharactersAsString} ]`.red);
    }
    return argument;
  };

  return {

    burgeon: (yargs) => {
      configure.configureGutIfNeeded()
        .then((gutOptions) => {
          const args = yargs
            .usage('usage: $0 burgeon [options]')
            .option(ARGUMENTS.NEW_VERSION_BRANCH.name, ARGUMENTS.NEW_VERSION_BRANCH)
            .option(ARGUMENTS.NEW_FEATURE_BRANCH.name, ARGUMENTS.NEW_FEATURE_BRANCH)
            .option(ARGUMENTS.NEW_DEV_BRANCH.name, ARGUMENTS.NEW_DEV_BRANCH)
            .option(ARGUMENTS.TICKET_NUMBER.name, ARGUMENTS.TICKET_NUMBER)
            .option(ARGUMENTS.IS_BUILDABLE.name, ARGUMENTS.IS_BUILDABLE)
            .check(currentArguments => {
              const newFeatureBranch = currentArguments[ ARGUMENTS.NEW_FEATURE_BRANCH.name ];
              const newDevBranch = currentArguments[ ARGUMENTS.NEW_DEV_BRANCH.name ];

              if (currentArguments[ ARGUMENTS.TICKET_NUMBER.name ] && !newDevBranch) {
                throw Error(`Argument ${ARGUMENTS.TICKET_NUMBER.name} only makes sense when creating a dev branch`.red);
              }

              if (currentArguments[ ARGUMENTS.IS_BUILDABLE.name ] && !newFeatureBranch) {
                throw Error(`Argument ${ARGUMENTS.IS_BUILDABLE.name} only makes sense when creating a feature branch`.red);
              }

              return true;
            })
            .coerce(ARGUMENTS.NEW_VERSION_BRANCH.name, argument => {
              if (_.isEmpty(argument)) {
                return argument;
              }

              if (!/[0.9]+\.[0.9]+\.[0.9]+(\.[0.9]+)?/.test(argument)) { // TODO: Use semver instead
                throw Error(`Argument ${ARGUMENTS.NEW_VERSION_BRANCH.name} must follow semver!`.red);
              }
              return argument;
            })
            .coerce(ARGUMENTS.NEW_FEATURE_BRANCH.name, argument => hasNoneOf([ '_', '#' ], argument, ARGUMENTS.NEW_FEATURE_BRANCH.name))
            .coerce(ARGUMENTS.NEW_DEV_BRANCH.name, argument => hasNoneOf([ '_', '#' ], argument, ARGUMENTS.NEW_DEV_BRANCH.name))
            .argv;

          const parsedBranch = branches.parseBranchName();
          if (args[ ARGUMENTS.NEW_VERSION_BRANCH.name ]) {
            createVersionBranch(parsedBranch, args, gutOptions);
          } else if (args[ ARGUMENTS.NEW_FEATURE_BRANCH.name ]) {
            createFeatureBranch(parsedBranch, args, gutOptions);
          } else {
            createDevBranch(parsedBranch, args, gutOptions);
          }

        })
        .catch((error) => {
          if (error) {
            execution.exit(1, error.message);
          }
        });
    }
  };
})();
