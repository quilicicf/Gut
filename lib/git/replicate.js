const _ = require('lodash');
const path = require('path');

const configure = require('./configure');

const configuration = require('../utils/configuration');
const execution = require('../utils/execution');

module.exports = (() => {
  const GET_ARG_SERVER = (gutOptions) => {
    return {
      name: 'server',
      alias: 's',
      describe: 'The git server where the repository is.',
      demandOption: true,
      type: 'string',
      default: gutOptions.preferredGitServer,
      choices: _.keys(configuration.GIT_SERVERS_PRESET)
    };
  };

  const ARG_OWNER = {
    name: 'owner',
    alias: 'o',
    describe: 'The owner of the repository to be cloned.',
    demandOption: true,
    type: 'string'
  };

  const ARG_REPOSITORY = {
    name: 'repository',
    alias: 'r',
    describe: 'The name of the repository to be cloned.',
    demandOption: true,
    type: 'string'
  };

  return {
    replicate: async function replicate (yargs) {
      // TODO: when calling the method with --help, await breaks the command
      // See https://github.com/yargs/yargs/issues/510, might fix the issue
      const gutOptions = _.includes(process.argv, '--help') ? {} : await configure.configureGutIfNeeded();
      const ARG_SERVER = GET_ARG_SERVER(gutOptions);

      const args = yargs
        .usage('usage: $0 replicate [options]')
        .option(ARG_SERVER.name, ARG_SERVER)
        .option(ARG_OWNER.name, ARG_OWNER)
        .option(ARG_REPOSITORY.name, ARG_REPOSITORY)
        .check((currentArguments) => {
          if (!currentArguments) {
            const server = currentArguments[ ARG_SERVER.name ];
            _.set(currentArguments, ARG_OWNER.name, gutOptions.accounts[ server ].username);
          }

          return true;
        })
        .help()
        .argv;

      const server = args[ ARG_SERVER.name ];
      const owner = args[ ARG_OWNER.name ];
      const repository = args[ ARG_REPOSITORY.name ];
      const repositoriesPath = gutOptions[ configuration.GLOBAL_OPTIONS_STRUCTURE.REPOSITORIES_PATH ];

      const serverConfiguration = configuration.getGitServer(server);
      const repositoryUrl = serverConfiguration.getRepositoryUrl(owner, repository);

      const repositoryOwnerPath = path.resolve(repositoriesPath, server, owner);
      const repositoryPath = path.resolve(repositoryOwnerPath, repository);
      execution.print(`Cloning ${repositoryUrl} into ${repositoryPath}\n`);

      execution.execute(`mkdir -p ${repositoryOwnerPath}`);
      process.chdir(repositoryOwnerPath);
      execution.executeAndPipe(`git clone ${repositoryUrl}`);
    }
  };
})();
