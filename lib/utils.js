module.exports = (() => {
  const _ = require('lodash');
  const git = require('nodegit');
  const colors = require('colors');
  const execSync = require('child_process').execSync;

  const GIT_SERVERS_PRESET = {
    github: {
      getRepositoryUrl: (owner, repository) => {
        return `https://github.com/${owner}/${repository}`;
      }
    }
  };

  const getTopLevel = () => {
    const unsanitizedTopLevel = execSync('git rev-parse --show-toplevel');
    return _.replace(unsanitizedTopLevel, /\n/, '');
  };

  const moveUpTop = () => {
    process.chdir(getTopLevel());
  };

  const isDirty = () => {
    try {
      execSync('git diff --no-ext-diff --quiet --exit-code');
      return false;
    } catch (error) {
      return true;
    }
  };

  const hasStagedChanges = () => {
    try {
      execSync('git diff-index --cached --quiet HEAD --');
      return false;
    } catch (error) {
      return true;
    }
  };

  const hasUnstagedChanges = () => {
    try {
      execSync('[ -n "$(git ls-files --others --exclude-standard)" ]');
      return true;
    } catch (error) {
      return false;
    }
  };

  return {
    GIT_SERVERS_PRESET: GIT_SERVERS_PRESET,

    getTopLevel: getTopLevel,
    moveUpTop: moveUpTop,
    isDirty: isDirty,
    hasStagedChanges: hasStagedChanges,
    hasUnstagedChanges: hasUnstagedChanges,
    getGitServer: serverName => {
      if (!_.has(GIT_SERVERS_PRESET, serverName)) {
        throw Error(`Server ${serverName} not configured. Please make sure it is not being implemented and create an issue.`);
      }

      return GIT_SERVERS_PRESET[ serverName ];
    }
  };
})();
