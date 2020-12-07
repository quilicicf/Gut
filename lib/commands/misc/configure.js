const _ = require('lodash');
const fs = require('fs');
const path = require('path');

const { IS_TEST_MODE } = require('../../utils/isTest');

const { GLOBAL_OPTIONS_FILE_PATH, GLOBAL_OPTIONS_STRUCTURE } = require('../../utils/configuration');
const execution = require('../../utils/execution');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Guides you to create/replace your configuration file';

const QUESTIONS = {
  WRITE_FORGE_PATH: 'lib/git/configure:write_forge_path',
  WRITE_GITHUB_USERNAME: 'lib/git/configure:write_github_username',
  WRITE_GITHUB_TOKEN: 'lib/git/configure:write_github_token',
};

const saveConfigurationOnDisk = (gutOptions) => {
  fs.writeFileSync(GLOBAL_OPTIONS_FILE_PATH, `${JSON.stringify(gutOptions, null, 2)}\n`, 'utf8');
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
        return true;
      }

      throw Error(`No directory found at ${evaluatedDirPath}`.red);
    },
  };

  const forgePath = await ask(forgePathQuestion);
  _.set(gutOptions, GLOBAL_OPTIONS_STRUCTURE.REPOSITORIES_PATH, forgePath);
  return gutOptions;
};

const promptGithubUsername = async (gutOptions) => {
  const githubUsernameQuestion = {
    type: QUESTION_TYPES.STRING,
    id: QUESTIONS.WRITE_GITHUB_USERNAME,
    message: 'Type your GitHub account username',
  };

  const githubUsername = await ask(githubUsernameQuestion);
  _.set(gutOptions, 'accounts.github.username', githubUsername);
  return gutOptions;
};

const promptGithubPullRequestToken = async (gutOptions) => {
  const githubTokenQuestion = {
    type: QUESTION_TYPES.STRING,
    id: QUESTIONS.WRITE_GITHUB_TOKEN,
    message: 'Type your GitHub account PR token',
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
  const dirname = path.dirname(GLOBAL_OPTIONS_FILE_PATH);
  execution.execute(`mkdir -p ${dirname}`);

  const gutOptions = {
    preferredGitServer: 'github',
  };

  const prompts = [ promptGithubUsername, promptGithubPullRequestToken, promptForgePath ];
  saveConfigurationOnDisk(await recursiveChainAsyncCalls(prompts, gutOptions));
};

const initializeConfiguration = () => {
  execution.print('Looks like it\'s the first time you use Gut. Let\'s configure it first!');
  return writeConfiguration();
};

const configureArgs = (yargs) => yargs.usage(`usage: gut ${command} [options]`);

const configureHandler = () => {
  execution.print('Let\'s change your Gut configuration!');
  writeConfiguration();
};

const configureGutIfNeeded = () => {
  try {
    fs.statSync(GLOBAL_OPTIONS_FILE_PATH);
    const configuration = JSON.parse(fs.readFileSync(GLOBAL_OPTIONS_FILE_PATH, 'utf8'));
    if (IS_TEST_MODE) {
      const repositoriesPath = path.resolve(__dirname, '..', '..', 'test', 'repositories');
      _.set(configuration, GLOBAL_OPTIONS_STRUCTURE.REPOSITORIES_PATH, repositoriesPath);
    }

    return Promise.resolve(configuration);
  } catch (error) {
    return initializeConfiguration();
  }
};

module.exports = {
  command,
  aliases,
  describe,
  builder: configureArgs,
  handler: configureHandler,

  configureGutIfNeeded,
};
