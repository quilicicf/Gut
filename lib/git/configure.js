const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const configuration = require('../utils/configuration');
const execution = require('../utils/execution');
const { QUESTION_TYPES, ask } = require('../utils/prompt');

const QUESTIONS = {
  WRITE_FORGE_PATH: 'lib/git/configure:write_forge_path',
  WRITE_GITHUB_USERNAME: 'lib/git/configure:write_github_username',
  WRITE_GITHUB_TOKEN: 'lib/git/configure:write_github_token'
};

const saveConfigurationOnDisk = (gutOptions) => {
  fs.writeFileSync(configuration.GLOBAL_OPTIONS_FILE_PATH, `${JSON.stringify(gutOptions, null, 2)}\n`, 'utf8');
  execution.print('Your configuration is saved. You can change it anytime by running \'gut configure\'.\n'.green);
};

const promptForgePath = async (gutOptions) => {
  const forgePathQuestion = {
    type: QUESTION_TYPES.STRING,
    id: QUESTIONS.WRITE_FORGE_PATH,
    message: 'type your git repositories folder',
    validate (dirPath) {
      const evaluatedDirPath = _.includes(dirPath, '$')
        ? execution.execute(`printf '%s' "${dirPath}"`)
        : dirPath;

      if (fs.existsSync(evaluatedDirPath)) {
        return evaluatedDirPath;
      }

      throw Error(`No directory found at ${evaluatedDirPath}`.red);
    }
  };

  const forgePath = await ask(forgePathQuestion);
  _.set(gutOptions, 'repositoriesPath', forgePath);
  return gutOptions;
};

const promptGithubUsername = async (gutOptions) => {
  const githubUsernameQuestion = {
    type: QUESTION_TYPES.STRING,
    id: QUESTIONS.WRITE_GITHUB_USERNAME,
    message: 'Type your GitHub account username'
  };

  const githubUsername = await ask(githubUsernameQuestion);
  _.set(gutOptions, 'accounts.github.username', githubUsername);
  return gutOptions;
};

const promptGithubPullRequestToken = async (gutOptions) => {
  const githubTokenQuestion = {
    type: QUESTION_TYPES.STRING,
    id: QUESTIONS.WRITE_GITHUB_TOKEN,
    message: 'Type your GitHub account PR token'
  };

  const githubToken = await ask(githubTokenQuestion);
  _.set(gutOptions, 'accounts.github.pullRequestToken', githubToken);
  return gutOptions;
};

const recursiveChainAsyncCalls = async (commands, input) => {
  if (_.isEmpty(commands)) {
    return input;
  }

  const newInput = await commands[ 0 ](input);
  return recursiveChainAsyncCalls(_.drop(commands), newInput);
};

const writeConfiguration = async () => {
  const dirname = path.dirname(configuration.GLOBAL_OPTIONS_FILE_PATH);
  execution.execute(`mkdir -p ${dirname}`);

  const gutOptions = {
    preferredGitServer: 'github'
  };


  const prompts = [ promptGithubUsername, promptGithubPullRequestToken, promptForgePath ];
  saveConfigurationOnDisk(await recursiveChainAsyncCalls(prompts, gutOptions));
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

module.exports = { configureGutIfNeeded, changeConfiguration };
