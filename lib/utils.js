module.exports = (() => {
  const _ = require('lodash');
  const git = require('nodegit');
  const colors = require('colors');
  const execSync = require('child_process').execSync;

  const getTopLevel = () => {
    const unsanitizedTopLevel = execSync('git rev-parse --show-toplevel');
    return _.replace(unsanitizedTopLevel, /\n/, '');
  };

  const moveUpTop = () => {
    execSync('cd "$(git rev-parse --show-toplevel)"');
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
    getTopLevel: getTopLevel,
    moveUpTop: moveUpTop,
    isDirty: isDirty,
    hasStagedChanges: hasStagedChanges,
    hasUnstagedChanges: hasUnstagedChanges
  };
})();
