module.exports = (() => {
  const _ = require('lodash');
  const path = require('path');

  const utils = require('./utils');

  return {
    replicate: (yargs, gutOptions) => {
      const arguments = yargs
        .usage('usage: $0 replicate [options]')
        .option('server', {
          alias: 's',
          default: gutOptions.preferredGitServer,
          describe: 'The git server where the repository is',
          type: 'string'
        })
        .coerce('server', argument => {
          const presetNames = _.keys(utils.GIT_SERVERS_PRESET);
          if (!_.includes(presetNames, argument)) {
            throw Error(`The server should be in [ ${presetNames} ]`);
          }
          return argument;
        })
        .option('owner', {
          alias: 'o',
          default: gutOptions.username,
          demandOption: true,
          describe: 'The owner of the repository to be cloned',
          type: 'string'
        })
        .option('repository', {
          alias: 'r',
          demandOption: true,
          describe: 'The name of the repository to be cloned',
          type: 'string'
        })
        .help()
        .argv;

      const serverConfiguration = utils.getGitServer(arguments.server);
      const repositoryUrl = serverConfiguration.getRepositoryUrl(arguments.owner, arguments.repository);
      const repositoryOwnerPath = path.resolve(gutOptions.repositoriesPath, arguments.server, arguments.owner);
      const repositoryPath = path.resolve(repositoryOwnerPath, arguments.repository);
      utils.print(`Cloning ${repositoryUrl} into ${repositoryPath}\n`);

      utils.execute(`mkdir -p ${repositoryOwnerPath}`);
      process.chdir(repositoryOwnerPath);
      utils.executeAndPipe('git', [ 'clone', repositoryUrl ]);
    }
  };
})();
