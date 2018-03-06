const _ = require('lodash');
const fs = require('fs');

const configuration = require('../utils/configuration');
const execution = require('../utils/execution');
const { QUESTION_TYPES, ask } = require('../utils/prompt');

const QUESTIONS = {
  CHOOSE_REPOSITORY: 'lib/git/jump:choose_repository'
};

const ARG_TEMP_FILE = {
  name: 'temp-file',
  alias: 't',
  describe: 'The file where the target path will be output',
  type: 'string',
  demandOption: true
};

const ARG_GIT_SERVER = {
  name: 'git-server',
  alias: 'g',
  describe: 'The search text for the target repository git server',
  type: 'string'
};

const ARG_OWNER = {
  name: 'owner',
  alias: 'o',
  describe: 'The search text for the target repository owner',
  type: 'string'
};

const ARG_REPOSITORY = {
  name: 'repository',
  alias: 'r',
  describe: 'The search text for the target repository. ' +
  'You can pass it as the last positional argument if it does not cause an ambiguity with another parameter',
  type: 'string'
};

const GLOBAL_OPTIONS_STRUCTURE = configuration.GLOBAL_OPTIONS_STRUCTURE;

const writeSelectedPathAndExit = (tempFile, selectedPath) => {
  fs.writeFileSync(tempFile, `${selectedPath}`);
  execution.exit(0);
};

const parseArgument = (argument, defaultValue) => {
  if (argument === '') { // argument passed but empty
    return defaultValue;

  } else if (!argument) {
    return '**';

  }

  return argument;
};

const getRepositoryArgument = (args) => {
  const explicitArgument = args[ ARG_REPOSITORY.name ];

  if (explicitArgument) {
    return explicitArgument;
  }

  return args._.length === 2 ? args._[ 1 ] : '*';
};

const jumpArgs = (yargs) => {
  return yargs
    .option(ARG_TEMP_FILE.name, ARG_TEMP_FILE)
    .option(ARG_GIT_SERVER.name, ARG_GIT_SERVER)
    .option(ARG_OWNER.name, ARG_OWNER)
    .option(ARG_REPOSITORY.name, ARG_REPOSITORY)
    .help();
};

const jumpCommand = async (args) => {

  const tempFile = args[ ARG_TEMP_FILE.name ];

  // TODO: maybe get the whole config there ?
  const forge = _.trimEnd(configuration.getGlobalOption(configuration.GLOBAL_OPTIONS_STRUCTURE.REPOSITORIES_PATH), '/');
  const preferredGitServer = configuration.getGlobalOption(GLOBAL_OPTIONS_STRUCTURE.PREFERRED_GIT_SERVER);
  const preferredGitAccount = configuration.getGlobalOption(`accounts.${preferredGitServer}.username`);

  const gitServer = parseArgument(args[ ARG_GIT_SERVER.name ], preferredGitServer);
  const owner = parseArgument(args[ ARG_OWNER.name ], preferredGitAccount);
  const repository = getRepositoryArgument(args);

  const targets = execution.execute(`find '${forge}' -maxdepth 3 -ipath '${gitServer}/${owner}/${repository}' | sort`)
    .split('\n')
    .filter(item => item);

  const targetsSize = _.size(targets);
  if (targetsSize === 1) {
    writeSelectedPathAndExit(tempFile, targets[ 0 ]);

  } else if (targetsSize > 1) {
    const choosePathQuestion = {
      type: QUESTION_TYPES.LIST,
      id: QUESTIONS.CHOOSE_REPOSITORY,
      message: 'There are multiple repositories matching your list, please choose one:\n',
      choices: targets
    };

    const result = await ask(choosePathQuestion);
    writeSelectedPathAndExit(tempFile, result);

  } else {
    execution.exit(1, 'Your search did not match any repository. Please try another one.');
  }
};

module.exports = { QUESTIONS, jumpArgs, jumpCommand };
