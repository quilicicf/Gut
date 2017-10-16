const _ = require('lodash');
const os = require('os');
const fs = require('fs');
const path = require('path');

const execution = require('./utils/execution');
const configure = require('./configure');

module.exports = (() => {
  const GIT_SERVERS_PRESET = {
    github: {
      getRepositoryUrl: (owner, repository) => {
        return `git@github.com:${owner}/${repository}.git`;
      }
    }
  };

  const REPOSITORY_OPTION_DEFAULTS = {
    commitMessageSuffixTemplate: ''
  };

  const GLOBAL_OPTIONS_FILE_PATH = path.resolve(os.homedir(), '.config', 'gut', 'gut-config.json');

  const SCRIPTS_PATH = path.resolve(os.homedir(), '.config', 'gut');

  const REPOSITORY_OPTIONS_FILE_NAME = '.gut-config.json';

  const configureGutIfNeeded = () => {
    const gutOptionsPath = GLOBAL_OPTIONS_FILE_PATH;
    try {
      fs.statSync(gutOptionsPath);
      return new Promise((resolve) => resolve(JSON.parse(fs.readFileSync(gutOptionsPath, 'utf8'))));
    } catch (err) {
      return configure.initializeConfiguration();
    }
  };

  const getTopLevel = () => {
    const unsanitizedTopLevel = execution.execute('git rev-parse --show-toplevel');
    return _.replace(unsanitizedTopLevel, /\n/, '');
  };

  const moveUpTop = () => {
    process.chdir(getTopLevel());
  };

  const isDirty = () => {
    try {
      execution.execute('git diff --no-ext-diff --quiet --exit-code');
      return false;
    } catch (error) {
      return true;
    }
  };

  const hasStagedChanges = () => {
    try {
      execution.execute('git diff-index --cached --quiet HEAD --');
      return false;
    } catch (error) {
      return true;
    }
  };

  const hasUnstagedChanges = () => {
    try {
      execution.execute('[ -n "$(git ls-files --others --exclude-standard)" ]');
      return true;
    } catch (error) {
      return false;
    }
  };

  const getRepositoryOption = optionName => {
    const topLevelDirectory = getTopLevel();

    let result;
    try {
      const repositoryFileName = path.resolve(topLevelDirectory, REPOSITORY_OPTIONS_FILE_NAME);
      fs.statSync(repositoryFileName);
      const repositoryOptions = JSON.parse(fs.readFileSync(repositoryFileName, 'utf8'));
      result = repositoryOptions[ optionName ];
    } catch (err) {
      result = REPOSITORY_OPTION_DEFAULTS[ optionName ];
    }

    if (!result) {
      throw Error(`Option ${optionName} is not specified in the repository's options.`.red);
    }

    return result;
  };

  const getRemotes = () => {
    const remotesAsString = execution.execute('git remote show');
    return _(remotesAsString.split('\n'))
      .reject(remote => _.isEmpty(remote))
      .value();
  };

  const getGitServer = (serverName) => {
    if (!_.has(GIT_SERVERS_PRESET, serverName)) {
      throw Error(`Server ${serverName} not configured. Please make sure it is not being implemented and create an issue.`);
    }

    return GIT_SERVERS_PRESET[ serverName ];
  };

  return {
    GIT_SERVERS_PRESET,
    GLOBAL_OPTIONS_FILE_PATH,
    SCRIPTS_PATH,
    REPOSITORY_OPTIONS_FILE_NAME,

    configureGutIfNeeded,
    getRepositoryOption,

    moveUpTop,

    isDirty,
    hasStagedChanges,
    hasUnstagedChanges,

    getRemotes,

    getGitServer
  };
})();
