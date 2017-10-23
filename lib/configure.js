const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const configuration = require('./utils/configuration');
const execution = require('./utils/execution');
const prompt = require('./utils/prompt');

module.exports = (() => {
  const saveConfigurationOnDisk = (gutOptions) => {
    fs.writeFileSync(configuration.GLOBAL_OPTIONS_FILE_PATH, `${JSON.stringify(gutOptions, null, 2)}\n`, 'utf8');
    execution.print('Your configuration is saved. You can change it anytime by running \'gut configure\'.\n'.green);
  };

  const promptForgePath = (gutOptions) => {
    const promptOptions = {
      validator: dirPath => {
        try {
          fs.statSync(dirPath);
          return dirPath;
        } catch (error) {
          throw Error(`No directory found at ${dirPath}`.red);
        }
      }
    };

    return prompt.promisifiedPrompt('Type your git repositories folder', promptOptions)
      .then(forgePath => {
        _.set(gutOptions, 'repositoriesPath', forgePath);
        return gutOptions;
      });
  };

  const promptGithubUsername = (gutOptions) => {
    return prompt.promisifiedPrompt('Type your GitHub account username', {})
      .then(githubUsername => {
        _.set(gutOptions, 'accounts.github', githubUsername);
        return gutOptions;
      });
  };

  const writeConfiguration = () => {
    const dirname = path.dirname(configuration.GLOBAL_OPTIONS_FILE_PATH);
    execution.execute(`mkdir -p ${dirname}`);

    const gutOptions = {
      preferredGitServer: 'github'
    };

    return promptGithubUsername(gutOptions)
      .then(gutOptionsWithGithubUsername => promptForgePath(gutOptionsWithGithubUsername))
      .then(saveConfigurationOnDisk);
  };

  const initializeConfiguration = () => {
    execution.print('Looks like it\'s the first time you use Gut. Let\'s configure it first!');
    return writeConfiguration();
  };

  const changeConfiguration = () => {
    execution.print('Let\'s change your Gut configuration!');
    writeConfiguration();
  };

  const configureGutIfNeeded = () => {
    const gutOptionsPath = configuration.GLOBAL_OPTIONS_FILE_PATH;
    try {
      fs.statSync(gutOptionsPath);
      return new Promise((resolve) => resolve(JSON.parse(fs.readFileSync(gutOptionsPath, 'utf8'))));
    } catch (err) {
      return initializeConfiguration();
    }
  };

  return {
    configureGutIfNeeded,
    changeConfiguration
  };
})();
