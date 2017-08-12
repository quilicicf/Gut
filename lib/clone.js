module.exports = (() => {
  const _ = require('lodash');
  const git = require('nodegit');
  const colors = require('colors');

  return {
    clone: (gutOptions, arguments) => {
      if (_.isEmpty(arguments)) {
        console.log(`Clone failed, please provide owner and repository.`.red);
        return;
      }

      const owner = _.size(arguments) === 1 ? gutOptions.username : arguments[ 0 ];
      const repository = arguments[ _.size(arguments) === 1 ? 0 : 2 ];

      const repositoryUrl = `https://github.com/${owner}/${repository}`;
      const repositoryPath = `${gutOptions.repositoriesPath}/${owner}/${repository}`;
      console.log(`Cloning ${repositoryUrl} into ${repositoryPath}`.green);

      git.Clone(repositoryUrl, repositoryPath)
        .catch(function (err) {
          console.log(`Clone failed with the following error`.red, err);
        });
    }
  };
})();
