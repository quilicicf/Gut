const _ = require('lodash');

const fs = require('fs');
const path = require('path');
const minimatch = require('minimatch');
const { sync: globSync } = require('fast-glob');

const configuration = require('../../utils/configuration');
const execution = require('../../utils/execution');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [];
const describe = false;

const QUESTIONS = {
  CHOOSE_REPOSITORY: 'lib/git/jump:choose_repository',
};

const ARG_TEMP_FILE = {
  name: 'temp-file',
  alias: 't',
  describe: 'The file where the target path will be output',
  type: 'string',
  demandOption: true,
};

const ARG_GIT_SERVER = {
  name: 'git-server',
  alias: 'g',
  describe: 'The search text for the target repository git server',
  type: 'string',
};

const ARG_OWNER = {
  name: 'owner',
  alias: 'o',
  describe: 'The search text for the target repository owner',
  type: 'string',
};

const ARG_REPOSITORY = {
  name: 'repository',
  alias: 'r',
  describe: 'The search text for the target repository. '
    + 'You can pass it as the last positional argument if it does not cause an ambiguity with another parameter',
  type: 'string',
};

const { GLOBAL_OPTIONS_STRUCTURE } = configuration;

const writeSelectedPathAndExit = (tempFile, forgePath, selectedPath) => {
  fs.writeFileSync(tempFile, path.resolve(forgePath, selectedPath));
  execution.exit(0);
};

const surroungGlobWithAsterisks = glob => glob // Surrounds glob with * (means the glob can be found anywhere)
  .replace(/^([^*])/, '*$1')
  .replace(/([^*])$/, '$1*');

const parseArgument = (argument, defaultValue) => {
  if (argument === '') { return defaultValue; } // argument passed but empty
  if (!argument) { return '*'; } // no argument
  return surroungGlobWithAsterisks(`${argument}`);
};

const searchGlobsFromExplicitArguments = (gitServerArg, ownerArg, repositoryArg) => {
  const preferredGitServer = configuration.getGlobalOption(GLOBAL_OPTIONS_STRUCTURE.PREFERRED_GIT_SERVER);
  const preferredGitAccount = configuration.getGlobalOption(`accounts.${preferredGitServer}.username`);

  const gitServer = parseArgument(gitServerArg, preferredGitServer);
  const owner = parseArgument(ownerArg, preferredGitAccount);
  const repository = parseArgument(repositoryArg, '*');
  return [ `${gitServer}/${owner}/${repository}` ];
};

const searchGlobsFromPositionalArgument = (args) => {
  const glob = _.get(args, [ '_', '1' ], '*');
  const extensiveGlob = surroungGlobWithAsterisks(glob);
  return [
    `${extensiveGlob}/*/*`,
    `*/${extensiveGlob}/*`,
    `*/*/${extensiveGlob}`,
  ];
};

const jumpArgs = yargs => yargs
  .option(ARG_TEMP_FILE.name, ARG_TEMP_FILE)
  .option(ARG_GIT_SERVER.name, ARG_GIT_SERVER)
  .option(ARG_OWNER.name, ARG_OWNER)
  .option(ARG_REPOSITORY.name, ARG_REPOSITORY)
  .help();

const jumpHandler = async (args) => {
  const {
    [ ARG_TEMP_FILE.name ]: tempFile,
    [ ARG_GIT_SERVER.name ]: gitServerArg,
    [ ARG_OWNER.name ]: ownerArg,
    [ ARG_REPOSITORY.name ]: repositoryArg,
  } = args;

  // TODO: maybe get the whole config there ?
  const forgePath = configuration.getGlobalOption(configuration.GLOBAL_OPTIONS_STRUCTURE.REPOSITORIES_PATH);

  const searchGlobs = gitServerArg || ownerArg || repositoryArg
    ? searchGlobsFromExplicitArguments(gitServerArg, ownerArg, repositoryArg)
    : searchGlobsFromPositionalArgument(args);

  const targets = _.chain(globSync('*/*/*/.git', { deep: 4, cwd: forgePath, onlyDirectories: true }))
    .sortBy()
    .map(item => path.dirname(item)) // Remove .git from path
    .filter(item => _.some(searchGlobs, searchGlob => minimatch(item, searchGlob, { nocase: true })))
    .value();

  const targetsSize = _.size(targets);
  if (targetsSize === 1) {
    writeSelectedPathAndExit(tempFile, forgePath, targets[ 0 ]);

  } else if (targetsSize > 1) {
    const choosePathQuestion = {
      type: QUESTION_TYPES.AUTO_COMPLETE,
      id: QUESTIONS.CHOOSE_REPOSITORY,
      message: 'There are multiple repositories matching your list, please choose one:\n',
      async source (answers, search = '') {
        return _.filter(
          targets,
          target => target.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
        );
      },
      pageSize: 10,
    };

    const result = await ask(choosePathQuestion);
    writeSelectedPathAndExit(tempFile, forgePath, result);

  } else {
    execution.exit(1, 'Your search did not match any repository. Please try another one.');
  }
};

module.exports = {
  ARG_GIT_SERVER,
  ARG_OWNER,
  ARG_REPOSITORY,
  ARG_TEMP_FILE,

  QUESTIONS,

  command,
  aliases,
  describe,
  builder: jumpArgs,
  handler: jumpHandler,
};
