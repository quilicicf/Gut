module.exports = (() => {
  const _ = require('lodash');
  const utils = require('./utils');

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
    newParsedBranch.author = gutOptions.accounts.github; // TODO: change when adding new git servers
    newParsedBranch.baseBranch = utils.getCurrentBranch();

    const newBranchName = utils.buildBranchName(newParsedBranch);

    utils.execute(`git checkout -b ${newBranchName}`);
    utils.execute(`git config branch.${newBranchName}.description '${JSON.stringify(newParsedBranch)}'`);
  };

  const createVersionBranch = (parsedBranch, arguments, gutOptions) => {
    const newVersion = arguments[ ARGUMENTS.NEW_VERSION_BRANCH.name ];
    if (!utils.isMasterBranch(parsedBranch)) {
      throw Error(`It is only allowed to create version branches from master!`.red);
    }

    const newParsedBranch = _.cloneDeep(parsedBranch);
    newParsedBranch.version = newVersion;
    newParsedBranch.type = utils.BRANCH_TYPES.VERSION.name;

    createBranch(newParsedBranch, gutOptions);
  };

  const createFeatureBranch = (parsedBranch, arguments, gutOptions) => {
    const newFeature = arguments[ ARGUMENTS.NEW_FEATURE_BRANCH.name ];
    const isBuildable = arguments[ ARGUMENTS.IS_BUILDABLE.name ];
    if (!utils.isMasterBranch(parsedBranch) && !utils.isVersionBranch(parsedBranch)) {
      throw Error(`It is only allowed to create feature branches from version branches or master!`.red);
    }

    const newParsedBranch = _.cloneDeep(parsedBranch);
    newParsedBranch.feature = newFeature;
    newParsedBranch.isBuildable = isBuildable;
    newParsedBranch.type = utils.BRANCH_TYPES.FEATURE.name;

    createBranch(newParsedBranch, gutOptions);
  };

  const createDevBranch = (parsedBranch, arguments, gutOptions) => {
    const newDescription = arguments[ ARGUMENTS.NEW_DEV_BRANCH.name ];
    const newTicketNumber = arguments[ ARGUMENTS.TICKET_NUMBER.name ] || '';
    if (!utils.isVersionBranch(parsedBranch) && !utils.isFeatureBranch(parsedBranch)) {
      throw Error(`It is only allowed to create dev branches from version or feature branches!`.red);
    }

    const newParsedBranch = _.cloneDeep(parsedBranch);
    newParsedBranch.ticketNumber = newTicketNumber;
    newParsedBranch.description = newDescription;
    newParsedBranch.type = utils.BRANCH_TYPES.DEV.name;

    createBranch(newParsedBranch, gutOptions);
  };

  const hasNoneOf = (forbiddenCharacters, argument, argumentName) => {
    const hasForbiddenCharacters = _.some(forbiddenCharacters, forbiddenCharacter => argument.includes(forbiddenCharacter));
    if (hasForbiddenCharacters) {
      const forbiddenCharactersAsString = _.map(forbiddenCharacters, char => `'${char}'`); // TODO: stringification via lodash ?
      throw Error(`Argument ${argumentName} can't contain any of these characters [ ${forbiddenCharactersAsString} ]`.red);
    }
    return argument;
  };

  return {

    burgeon: (yargs) => {
      utils.configureGutIfNeeded()
        .then(gutOptions => {
          const arguments = yargs
            .usage('usage: $0 switch [options]')
            .option(ARGUMENTS.NEW_VERSION_BRANCH.name, ARGUMENTS.NEW_VERSION_BRANCH)
            .option(ARGUMENTS.NEW_FEATURE_BRANCH.name, ARGUMENTS.NEW_FEATURE_BRANCH)
            .option(ARGUMENTS.NEW_DEV_BRANCH.name, ARGUMENTS.NEW_DEV_BRANCH)
            .option(ARGUMENTS.TICKET_NUMBER.name, ARGUMENTS.TICKET_NUMBER)
            .option(ARGUMENTS.IS_BUILDABLE.name, ARGUMENTS.IS_BUILDABLE)
            .check(arguments => {
              const newFeatureBranch = arguments[ ARGUMENTS.NEW_FEATURE_BRANCH.name ];
              const newDevBranch = arguments[ ARGUMENTS.NEW_DEV_BRANCH.name ];

              if (arguments[ ARGUMENTS.TICKET_NUMBER.name ] && !newDevBranch) {
                throw Error(`Argument ${ARGUMENTS.TICKET_NUMBER.name} only makes sense when creating a dev branch`.red);
              }

              if (arguments[ ARGUMENTS.IS_BUILDABLE.name ] && !newFeatureBranch) {
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

          const parsedBranch = utils.parseBranchName();
          if (arguments[ ARGUMENTS.NEW_VERSION_BRANCH.name ]) {
            createVersionBranch(parsedBranch, arguments, gutOptions);

          } else if (arguments[ ARGUMENTS.NEW_FEATURE_BRANCH.name ]) {
            createFeatureBranch(parsedBranch, arguments, gutOptions);

          } else {
            createDevBranch(parsedBranch, arguments, gutOptions);

          }
        });
    }
  };
})();
