module.exports = (() => {
  const _ = require('lodash');
  const git = require('nodegit');
  const colors = require('colors');
  const path = require('path');
  const progress = require('single-line-log').stdout;


  return {
    clone: (yargs, gutOptions) => {
      const arguments = yargs
        .usage('usage: $0 clone [options]')
        .option('owner', {
          alias: 'o',
          default: gutOptions.username,
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

      const repositoryUrl = `https://github.com/${arguments.owner}/${arguments.repository}`;
      const repositoryPath = path.resolve(gutOptions.repositoriesPath, arguments.owner, arguments.repository);
      console.log(`Cloning ${repositoryUrl} into ${repositoryPath}`);

      console.log();
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
