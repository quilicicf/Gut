const _ = require('lodash');
const { execute, executeSilently } = require('./execution');

const getTopLevel = () => {
  try {
    const unsanitizedTopLevel = executeSilently('git rev-parse --show-toplevel');
    return _.replace(unsanitizedTopLevel, /\n/, '');
  } catch (error) {
    return '';
  }
};

const moveUpTop = () => {
  process.chdir(getTopLevel());
};

const isDirty = () => {
  try {
    execute('git diff --no-ext-diff --quiet --exit-code');
    return false;
  } catch (error) {
    return true;
  }
};

const hasStagedChanges = () => {
  try {
    execute('git diff-index --cached --quiet HEAD --');
    return false;
  } catch (error) {
    return true;
  }
};

const hasUnstagedChanges = () => {
  try {
    execute('[ -n "$(git ls-files --others --exclude-standard)" ]');
    return true;
  } catch (error) {
    return false;
  }
};

const getRemotes = () => _.words(execute('git remote show'));

module.exports = {
  getTopLevel,
  moveUpTop,

  isDirty,
  hasStagedChanges,
  hasUnstagedChanges,

  getRemotes,
};
