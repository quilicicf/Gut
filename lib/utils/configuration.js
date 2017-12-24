const _ = require('lodash');

const fs = require('fs');
const os = require('os');
const path = require('path');

const git = require('./git');

module.exports = (() => {
  const GIT_SERVERS_PRESET = {
    github: {
      getRepositoryUrl: (owner, repository) => {
        return `git@github.com:${owner}/${repository}.git`;
      }
    }
  };

  const GLOBAL_OPTIONS_STRUCTURE = {
    PREFERRED_GIT_SERVER: 'preferredGitServer',
    REPOSITORIES_PATH: 'repositoriesPath',
    ACCOUNTS: 'accounts',
    TOOLS: 'tools'
  };

  const GLOBAL_OPTION_DEFAULTS = {
    preferredGitServer: 'github'
  };

  const REPOSITORY_OPTIONS_STRUCTURE = {
    COMMIT_MESSAGE_SUFFIX_TEMPLATE: 'commitMessageSuffixTemplate',
    REVIEW_TOOL: 'reviewTool',
    CI: 'ci'
  };

  const REPOSITORY_OPTION_DEFAULTS = {
    commitMessageSuffixTemplate: ''
  };

  const GLOBAL_OPTIONS_FILE_PATH = path.resolve(os.homedir(), '.config', 'gut', 'gut-config.json');

  const SCRIPTS_PATH = path.resolve(os.homedir(), '.config', 'gut');

  const REPOSITORY_OPTIONS_FILE_NAME = '.gut-config.json';

  const getGitServer = (serverName) => {
    if (!_.has(GIT_SERVERS_PRESET, serverName)) {
      throw Error(`Server ${serverName} not configured. Please make sure it is not being implemented and create an issue.`);
    }

    return GIT_SERVERS_PRESET[ serverName ];
  };

  const getOption = (filePath, defaults, optionPath) => {
    try {
      fs.statSync(filePath);
      const parsedOptions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return _.get(parsedOptions, optionPath);
    } catch (error) {
      return _.get(defaults, optionPath);
    }
  };

  const getGlobalOption = (optionPath) => {
    const optionValue = getOption(GLOBAL_OPTIONS_FILE_PATH, GLOBAL_OPTION_DEFAULTS, optionPath);

    if (!optionValue) {
      throw Error(`Option ${optionPath} is not specified in the global options.`.red);
    }

    return optionValue;
  };

  const getRepositoryOptionOrUndefined = (optionPath) => {
    const repositoryOptionsFilePath = path.resolve(git.getTopLevel(), REPOSITORY_OPTIONS_FILE_NAME);
    return getOption(repositoryOptionsFilePath, REPOSITORY_OPTION_DEFAULTS, optionPath);
  };

  const getRepositoryOption = (optionPath) => {
    const optionValue = getRepositoryOptionOrUndefined(optionPath);

    if (!optionValue) {
      throw Error(`Option ${optionPath} is not specified in the repository's options.`.red);
    }

    return optionValue;
  };

  const parseRepositoryPath = () => {
    const topLevel = git.getTopLevel();
    const [ gitServer, ownerName, repositoryName ] = _.takeRight(topLevel.split('/'), 3);
    return {
      gitServer,
      ownerName,
      repositoryName
    };
  };

  return {
    GIT_SERVERS_PRESET,

    GLOBAL_OPTIONS_STRUCTURE,
    GLOBAL_OPTION_DEFAULTS,
    GLOBAL_OPTIONS_FILE_PATH,

    REPOSITORY_OPTIONS_STRUCTURE,
    REPOSITORY_OPTION_DEFAULTS,
    REPOSITORY_OPTIONS_FILE_NAME,

    SCRIPTS_PATH,

    getGitServer,

    getGlobalOption,
    getRepositoryOption,
    getRepositoryOptionOrUndefined,

    parseRepositoryPath
  };
})();
