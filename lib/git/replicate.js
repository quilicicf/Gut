const _ = require('lodash');
const path = require('path');

const configure = require('./configure');

const configuration = require('../utils/configuration');
const execution = require('../utils/execution');

const ARG_SERVER = {
  name: 'server',
  alias: 's',
  describe: 'The git server where the repository is.',
  demandOption: true,
  type: 'string',
  // default: gutOptions.preferredGitServer,
  choices: _.keys(configuration.GIT_SERVERS_PRESET)
};

const ARG_OWNER = {
  name: 'owner',
  alias: 'o',
  describe: 'The owner of the repository to be cloned.',
  demandOption: true,
  type: 'string'
  // TODO: should be retrieved from the actual git server (option server)
  // default: gutOptions.accounts[ gutOptions.preferredGitServer ]
};

const ARG_REPOSITORY = {
  name: 'repository',
  alias: 'r',
  describe: 'The name of the repository to be cloned.',
  demandOption: true,
  type: 'string'
};

module.exports = {
  replicateArgs: (yargs) => {
    return yargs
      .usage(`usage: $0 ${path.parse(__filename).name} [options]`)
      .option(ARG_SERVER.name, ARG_SERVER)
      .option(ARG_OWNER.name, ARG_OWNER)
      .option(ARG_REPOSITORY.name, ARG_REPOSITORY)
      .help();
  },

  replicateCommand: async (args) => {
    const gutOptions = await configure.configureGutIfNeeded();

    const serverName = args[ ARG_SERVER.name ] || gutOptions.preferredGitServer;
    const serverConfiguration = configuration.getGitServer(serverName);

    const owner = args[ ARG_OWNER.name ] || gutOptions.accounts[ serverName ];
    if (!owner) {
      throw new Error('Cannot replicate a repository without owner');
    }

    const repository = args[ ARG_REPOSITORY.name ];
    const repositoryUrl = serverConfiguration.getRepositoryUrl(owner, repository);

    const repositoriesPath = gutOptions[ configuration.GLOBAL_OPTIONS_STRUCTURE.REPOSITORIES_PATH ];
    const repositoryOwnerPath = path.resolve(repositoriesPath, serverName, owner);
    const repositoryPath = path.resolve(repositoryOwnerPath, repository);
    execution.print(`Cloning ${repositoryUrl} into ${repositoryPath}\n`.green);

    execution.execute(`mkdir -p ${repositoryOwnerPath}`);
    process.chdir(repositoryOwnerPath);
    execution.executeAndPipe(`git clone ${repositoryUrl}`);
  }
};
