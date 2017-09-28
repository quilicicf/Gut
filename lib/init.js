module.exports = (() => {
  const _ = require('lodash');
  const fs = require('fs');
  const path = require('path');
  const utils = require('./utils');


  const saveConfigurationOnDisk = (gutOptions) => {
    fs.writeFileSync(utils.GLOBAL_OPTIONS_FILE_PATH, JSON.stringify(gutOptions, null, 2), 'utf8');
    utils.print(`Your configuration is saved. You can change it anytime by running 'gut init'.\n`.green);
  };

  const promptForgePath = (gutOptions) => {
    const promptOptions = {
      validator: path => {
        try {
          fs.statSync(path);
          return path;
        } catch (error) {
          throw Error(`No directory found at ${path}`.red);
        }
      }
    };

    return utils.promisifiedPrompt(`Type your git repositories folder`, promptOptions)
      .then(forgePath => {
        _.set(gutOptions, 'repositoriesPath', forgePath);
        return gutOptions;
      });
  };

  const promptGithubUsername = (gutOptions) => {
    return utils.promisifiedPrompt(`Type your GitHub account username`, {})
      .then(githubUsername => {
        _.set(gutOptions, 'accounts.github', githubUsername);
        return gutOptions;
      });
  };

  return {
    init: gutOptionsPath => {
      const dirname = path.dirname(gutOptionsPath);
      utils.execute(`mkdir -p ${dirname}`);

      utils.print(`Looks like it's the first time you use Gut. Let's configure it first!`);
      const gutOptions = {
        preferredGitServer: 'github'
      };

      return promptGithubUsername(gutOptions)
        .then(gutOptionsWithGithubUsername => promptForgePath(gutOptionsWithGithubUsername))
        .then(saveConfigurationOnDisk);
    }
  };
})();
