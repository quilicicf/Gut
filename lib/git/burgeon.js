const _ = require('lodash');

const path = require('path');

const configure = require('./configure');

const branches = require('../utils/branches');
const execution = require('../utils/execution');

const NAME = path.parse(__filename).name;
const ALIASES = [ NAME.charAt(0) ];
const IDENTIFIERS = _.concat(NAME, ALIASES);
const DESCRIPTION = 'Creates a branch';

const ARG_NEW_VERSION_BRANCH = {
  name: 'new-version',
  alias: 'V',
  describe: 'Version to use to create a new version branch',
  type: 'string'
};

const ARG_NEW_FEATURE_BRANCH = {
  name: 'feature',
  alias: 'f',
  describe: 'Feature to use to create a new feature branch',
  type: 'string'
};

const ARG_NEW_DEV_BRANCH = {
  name: 'dev',
  alias: 'd',
  describe: 'Description to use to create a new dev branch',
  type: 'string'
};

const ARG_TICKET_NUMBER = {
  name: 'ticket-number',
  alias: 'n',
  describe: 'Specifies the ticket number when creating a new branch',
  type: 'integer'
};

const ARG_IS_BUILDABLE = {
  name: 'buildable',
  alias: 'b',
  describe: 'Specifies if the new branch should be buildable (only available on feature branches)',
  type: 'boolean'
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
  const newVersion = args[ ARG_NEW_VERSION_BRANCH.name ];
  if (!branches.isMasterBranch(parsedBranch)) {
    throw Error('It is only allowed to create version branches from master!'.red);
  }

  const newParsedBranch = _.cloneDeep(parsedBranch);
  newParsedBranch.version = newVersion;
  newParsedBranch.type = branches.BRANCH_TYPES.VERSION.name;

  createBranch(newParsedBranch, gutOptions);
};

const createFeatureBranch = (parsedBranch, args, gutOptions) => {
  const newFeature = args[ ARG_NEW_FEATURE_BRANCH.name ];
  const isBuildable = args[ ARG_IS_BUILDABLE.name ];
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
  const newDescription = args[ ARG_NEW_DEV_BRANCH.name ];
  const newTicketNumber = args[ ARG_TICKET_NUMBER.name ] || '';
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

const burgeonArgs = (yargs) => {
  return yargs
    .usage(`usage: $0 ${NAME} [options]`)
    .option(ARG_NEW_VERSION_BRANCH.name, ARG_NEW_VERSION_BRANCH)
    .option(ARG_NEW_FEATURE_BRANCH.name, ARG_NEW_FEATURE_BRANCH)
    .option(ARG_NEW_DEV_BRANCH.name, ARG_NEW_DEV_BRANCH)
    .option(ARG_TICKET_NUMBER.name, ARG_TICKET_NUMBER)
    .option(ARG_IS_BUILDABLE.name, ARG_IS_BUILDABLE)
    .check((currentArguments) => {
      const newFeatureBranch = currentArguments[ ARG_NEW_FEATURE_BRANCH.name ];
      const newDevBranch = currentArguments[ ARG_NEW_DEV_BRANCH.name ];

      if (currentArguments[ ARG_TICKET_NUMBER.name ] && !newDevBranch) {
        throw Error(`Argument ${ARG_TICKET_NUMBER.name} only makes sense when creating a dev branch`.red);
      }

      if (currentArguments[ ARG_IS_BUILDABLE.name ] && !newFeatureBranch) {
        throw Error(`Argument ${ARG_IS_BUILDABLE.name} only makes sense when creating a feature branch`.red);
      }

      return true;
    })
    .coerce(ARG_NEW_VERSION_BRANCH.name, (argument) => {
      if (_.isEmpty(argument)) {
        return argument;
      }

      if (!/[0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?/.test(argument)) { // TODO: Use semver instead
        throw Error(`Argument ${ARG_NEW_VERSION_BRANCH.name} must follow semver!`.red);
      }
      return argument;
    })
    .coerce(ARG_NEW_FEATURE_BRANCH.name, argument => hasNoneOf([ '_', '#' ], argument, ARG_NEW_FEATURE_BRANCH.name))
    .coerce(ARG_NEW_DEV_BRANCH.name, argument => hasNoneOf([ '_', '#' ], argument, ARG_NEW_DEV_BRANCH.name));
};

const burgeonCommand = async (args) => {
  const gutOptions = await configure.configureGutIfNeeded();

  const parsedBranch = branches.parseBranchName();
  if (args[ ARG_NEW_VERSION_BRANCH.name ]) {
    createVersionBranch(parsedBranch, args, gutOptions);
  } else if (args[ ARG_NEW_FEATURE_BRANCH.name ]) {
    createFeatureBranch(parsedBranch, args, gutOptions);
  } else {
    createDevBranch(parsedBranch, args, gutOptions);
  }
};

module.exports = {
  NAME,
  ALIASES,
  IDENTIFIERS,
  DESCRIPTION,

  ARG_IS_BUILDABLE,
  ARG_NEW_DEV_BRANCH,
  ARG_NEW_FEATURE_BRANCH,
  ARG_NEW_VERSION_BRANCH,
  ARG_TICKET_NUMBER,

  builder: burgeonArgs,
  command: burgeonCommand
};
