const _ = require('lodash');
const execution = require('./execution');

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

const getRemotes = () => _.words(execution.execute('git remote show'));

module.exports = {
  getTopLevel,
  moveUpTop,

  isDirty,
  hasStagedChanges,
  hasUnstagedChanges,

  getRemotes,
};
