const _ = require('lodash');

const { writeFileSync } = require('fs');
const minimatch = require('minimatch');
const { sync: globSync } = require('fast-glob');
const {
  resolve: resolvePath, dirname, parse: parsePath, basename,
} = require('path');

const { exit } = require('../../utils/execution');
const { getTopLevel } = require('../../utils/git');
const configuration = require('../../utils/configuration');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = parsePath(__filename).name;
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
  writeFileSync(tempFile, resolvePath(forgePath, selectedPath));
  exit(0);
};

/**
 * Surrounds glob with * (means the glob can be found anywhere)
 */
const surroundGlobWithAsterisks = glob => glob
  .replace(/^([^*])/, '*$1')
  .replace(/([^*])$/, '$1*');

const parseArgument = (argument, defaultValue) => {
  if (argument === '') { return defaultValue; } // argument passed but empty
  if (!argument) { return '*'; } // no argument
  return surroundGlobWithAsterisks(`${argument}`);
};

const computeSearchGlobsFromExplicitArguments = (gitServerArg, ownerArg, repositoryArg) => {
  const preferredGitServer = configuration.getGlobalOption(GLOBAL_OPTIONS_STRUCTURE.PREFERRED_GIT_SERVER);
  const preferredGitAccount = configuration.getGlobalOption(`accounts.${preferredGitServer}.username`);

  const gitServer = parseArgument(gitServerArg, preferredGitServer);
  const owner = parseArgument(ownerArg, preferredGitAccount);
  const repository = parseArgument(repositoryArg, '*');
  return {
    repository: repositoryArg,
    glob: `${gitServer}/${owner}/${repository}`,
  };
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

  const forgePath = configuration.getGlobalOption(configuration.GLOBAL_OPTIONS_STRUCTURE.REPOSITORIES_PATH);

  const { glob, repository } = gitServerArg || ownerArg || repositoryArg
    ? computeSearchGlobsFromExplicitArguments(gitServerArg, ownerArg, repositoryArg)
    : computeSearchGlobsFromExplicitArguments(null, null, _.get(args, [ '_', '1' ], '*'));

  const targets = _.chain(globSync('*/*/*/.git', { deep: 4, cwd: forgePath, onlyDirectories: true }))
    .map(item => dirname(item)) // Remove .git from path
    .filter(item => minimatch(item, glob, { nocase: true }))
    .filter(item => resolvePath(forgePath, item) !== getTopLevel()) // Remove current git repository from targets
    .value()
    .sort();

  const directMatch = _.find(targets, target => basename(target).localeCompare(repository));
  if (directMatch) { writeSelectedPathAndExit(tempFile, forgePath, targets[ 0 ]); }

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
    exit(1, 'Your search did not match any repository. Please try another one.');
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
