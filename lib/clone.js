module.exports = (() => {
  require('colors');
  const _ = require('lodash');
  const git = require('nodegit');
  const path = require('path');
  const progress = require('single-line-log').stdout;

  const utils = require('./utils');

  return {
    clone: (yargs, gutOptions) => {
      const arguments = yargs
        .usage('usage: $0 clone [options]')
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
      const repositoryPath = path.resolve(gutOptions.repositoriesPath, arguments.server, arguments.owner, arguments.repository);
      console.log(`Cloning ${repositoryUrl} into ${repositoryPath}\n`);

      const cloneOptions = {};
      _.set(cloneOptions, 'fetchOpts.callbacks.transferProgress', info => {
        const bytes = _.padStart(info.receivedBytes(), 9);
        const deltas = _.padStart(info.totalDeltas(), 9);
        const objects = _.padStart(info.totalObjects(), 9);

        progress(`Received bytes: ${bytes},  total objects: ${objects},  total deltas: ${deltas}\n`);
      });

      git.Clone(repositoryUrl, repositoryPath, cloneOptions)
        .then(() => {
          console.log('Finished successfully!'.green)
        })
        .catch(function (err) {
          console.log(`Clone failed with the following error:\n`.red, err);
        });
    }
  };
})();
