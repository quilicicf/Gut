const _ = require('lodash');

const path = require('path');

const configure = require('../misc/configure');

const branches = require('../../utils/branches');
const execution = require('../../utils/execution');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Creates a branch';

const ARG_NEW_VERSION_BRANCH = {
  name: 'new-version',
  alias: 'V',
  describe: 'Version to use to create a new version branch',
  type: 'string',
};

const ARG_FEATURE = {
  name: 'feature',
  alias: 'f',
  describe: 'Feature to use to create a new feature branch',
  type: 'array',
};

const ARG_DESCRIPTION = {
  name: 'description',
  alias: 'd',
  describe: 'Description to use when creating a new dev branch. Receives and array of strings joined in camel-case style',
  type: 'array',
};

const ARG_TICKET_NUMBER = {
  name: 'ticket-number',
  alias: 'n',
  describe: 'Specifies the ticket number when creating a new branch',
  type: 'integer',
};

const ARG_IS_BUILDABLE = {
  name: 'buildable',
  alias: 'b',
  describe: 'Specifies if the new branch should be buildable (only available on feature branches)',
  type: 'boolean',
};

const camelCaseJoin = (stringArray) => (
  _.reduce([ _.join, _.camelCase ], (seed, operation) => operation(seed), stringArray)
);

const createBranch = (newParsedBranch, gutOptions) => {
  const newBranchDescription = _.cloneDeep(newParsedBranch);
  newBranchDescription.author = gutOptions.accounts.github.username; // TODO: change when adding new git servers
  newBranchDescription.baseBranch = branches.getCurrentBranchName();

  const newBranchName = branches.buildBranchName(newBranchDescription);

  execution.execute([
    `git checkout -b ${newBranchName}`,
    `git config branch.${newBranchName}.description '${JSON.stringify(newBranchDescription)}'`,
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
  const newFeature = args[ ARG_FEATURE.name ];
  const isBuildable = args[ ARG_IS_BUILDABLE.name ];
  if (!branches.isMasterBranch(parsedBranch) && !branches.isVersionBranch(parsedBranch)) {
    throw Error('It is only allowed to create feature branches from version branches or master!'.red);
  }

  const newParsedBranch = _.cloneDeep(parsedBranch);
  newParsedBranch.feature = camelCaseJoin(newFeature);
  newParsedBranch.isBuildable = isBuildable;
  newParsedBranch.type = branches.BRANCH_TYPES.FEATURE.name;

  createBranch(newParsedBranch, gutOptions);
};

const createDevBranch = (parsedBranch, args, gutOptions) => {
  const newDescription = args[ ARG_DESCRIPTION.name ];
  const newTicketNumber = args[ ARG_TICKET_NUMBER.name ] || '';
  if (!branches.isVersionBranch(parsedBranch) && !branches.isFeatureBranch(parsedBranch)) {
    throw Error('It is only allowed to create dev branches from version or feature branches!'.red);
  }

  const newParsedBranch = _.cloneDeep(parsedBranch);
  newParsedBranch.ticketNumber = newTicketNumber;
  newParsedBranch.description = camelCaseJoin(newDescription);
  newParsedBranch.type = branches.BRANCH_TYPES.DEV.name;

  createBranch(newParsedBranch, gutOptions);
};

const hasNoneOf = (forbiddenCharacters, argument, argumentName) => {
  const argumentAsString = Array.isArray(argument) ? _.join(argument) : argument;
  const hasForbiddenCharacters = _.some(
    forbiddenCharacters,
    (forbiddenCharacter) => argumentAsString.includes(forbiddenCharacter),
  );
  if (hasForbiddenCharacters) {
    const forbiddenCharactersAsString = _.map(forbiddenCharacters, (char) => `'${char}'`); // TODO: stringification via lodash ?
    throw Error(`Argument ${argumentName} can't contain any of these characters [ ${forbiddenCharactersAsString} ]`.red);
  }
  return argument;
};

const burgeonArgs = (yargs) => yargs
  .usage(`usage: gut ${command} [options]`)
  .option(ARG_NEW_VERSION_BRANCH.name, ARG_NEW_VERSION_BRANCH)
  .option(ARG_FEATURE.name, ARG_FEATURE)
  .option(ARG_DESCRIPTION.name, ARG_DESCRIPTION)
  .option(ARG_TICKET_NUMBER.name, ARG_TICKET_NUMBER)
  .option(ARG_IS_BUILDABLE.name, ARG_IS_BUILDABLE)
  .check((currentArguments) => {
    const featureName = currentArguments[ ARG_FEATURE.name ];
    const description = currentArguments[ ARG_DESCRIPTION.name ];

    if (currentArguments[ ARG_TICKET_NUMBER.name ] && !description) {
      throw Error(`Argument ${ARG_TICKET_NUMBER.name} only makes sense when creating a dev branch`.red);
    }

    if (currentArguments[ ARG_IS_BUILDABLE.name ] && !featureName) {
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
  .coerce(ARG_FEATURE.name, (argument) => hasNoneOf([ '_', '#' ], argument, ARG_FEATURE.name))
  .coerce(ARG_DESCRIPTION.name, (argument) => hasNoneOf([ '_', '#' ], argument, ARG_DESCRIPTION.name));

const burgeonHandler = async (args) => {
  const gutOptions = await configure.configureGutIfNeeded();

  const parsedBranch = branches.parseBranchName();
  if (args[ ARG_NEW_VERSION_BRANCH.name ]) {
    createVersionBranch(parsedBranch, args, gutOptions);
  } else if (args[ ARG_FEATURE.name ]) {
    createFeatureBranch(parsedBranch, args, gutOptions);
  } else {
    createDevBranch(parsedBranch, args, gutOptions);
  }
};

module.exports = {
  ARG_IS_BUILDABLE,
  ARG_NEW_DEV_BRANCH: ARG_DESCRIPTION,
  ARG_NEW_FEATURE_BRANCH: ARG_FEATURE,
  ARG_NEW_VERSION_BRANCH,
  ARG_TICKET_NUMBER,

  command,
  aliases,
  describe,
  builder: burgeonArgs,
  handler: burgeonHandler,
};
