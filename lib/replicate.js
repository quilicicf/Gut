module.exports = (() => {
  const _ = require('lodash');
  const path = require('path');

  const utils = require('./utils');

  return {
    replicate: (yargs) => {
      utils.configureGutIfNeeded()
        .then(gutOptions => {
          const ARGUMENTS = {
            SERVER: {
              name: 'server',
              alias: 's',
              describe: 'The git server where the repository is.',
              demandOption: true,
              type: 'string',
              default: gutOptions.preferredGitServer,
              choices: _.keys(utils.GIT_SERVERS_PRESET)
            },
            OWNER: {
              name: 'owner',
              alias: 'o',
              describe: 'The owner of the repository to be cloned.',
              demandOption: true,
              type: 'string',
              // TODO: should be retrieved from the actual git server (option server)
              default: gutOptions.accounts[gutOptions.preferredGitServer]
            },
            REPOSITORY: {
              name: 'repository',
              alias: 'r',
              describe: 'The name of the repository to be cloned.',
              demandOption: true,
              type: 'string'
            }
          };

          const arguments = yargs
            .usage('usage: $0 replicate [options]')
            .option(ARGUMENTS.SERVER.name, ARGUMENTS.SERVER)
            .option(ARGUMENTS.OWNER.name, ARGUMENTS.OWNER)
            .option(ARGUMENTS.REPOSITORY.name, ARGUMENTS.REPOSITORY)
            .help()
            .argv;

          const serverConfiguration = utils.getGitServer(arguments.server);
          const repositoryUrl = serverConfiguration.getRepositoryUrl(arguments.owner, arguments.repository);
          const repositoryOwnerPath = path.resolve(gutOptions.repositoriesPath, arguments.server, arguments.owner);
          const repositoryPath = path.resolve(repositoryOwnerPath, arguments.repository);
          utils.print(`Cloning ${repositoryUrl} into ${repositoryPath}\n`);

          utils.execute(`mkdir -p ${repositoryOwnerPath}`);
          process.chdir(repositoryOwnerPath);
          utils.executeAndPipe('git', ['clone', repositoryUrl]);
        });
    }
  };
})();
