const _ = require('lodash');
const path = require('path');

const configure = require('./configure');

const configuration = require('../utils/configuration');
const execution = require('../utils/execution');

module.exports = (() => {
  return {
    replicate: (yargs) => {
      configure.configureGutIfNeeded()
        .then(gutOptions => {
          const ARGUMENTS = {
            SERVER: {
              name: 'server',
              alias: 's',
              describe: 'The git server where the repository is.',
              demandOption: true,
              type: 'string',
              default: gutOptions.preferredGitServer,
              choices: _.keys(configuration.GIT_SERVERS_PRESET)
            },
            OWNER: {
              name: 'owner',
              alias: 'o',
              describe: 'The owner of the repository to be cloned.',
              demandOption: true,
              type: 'string',
              // TODO: should be retrieved from the actual git server (option server)
              default: gutOptions.accounts[ gutOptions.preferredGitServer ]
            },
            REPOSITORY: {
              name: 'repository',
              alias: 'r',
              describe: 'The name of the repository to be cloned.',
              demandOption: true,
              type: 'string'
            }
          };

          const args = yargs
            .usage('usage: $0 replicate [options]')
            .option(ARGUMENTS.SERVER.name, ARGUMENTS.SERVER)
            .option(ARGUMENTS.OWNER.name, ARGUMENTS.OWNER)
            .option(ARGUMENTS.REPOSITORY.name, ARGUMENTS.REPOSITORY)
            .help()
            .argv;

          const serverConfiguration = configuration.getGitServer(args.server);
          const repositoryUrl = serverConfiguration.getRepositoryUrl(args.owner, args.repository);
          const repositoryOwnerPath = path.resolve(gutOptions.repositoriesPath, args.server, args.owner);
          const repositoryPath = path.resolve(repositoryOwnerPath, args.repository);
          execution.print(`Cloning ${repositoryUrl} into ${repositoryPath}\n`);

          execution.execute(`mkdir -p ${repositoryOwnerPath}`);
          process.chdir(repositoryOwnerPath);
          execution.executeAndPipe(`git clone ${repositoryUrl}`);
        });
    }
  };
})();
