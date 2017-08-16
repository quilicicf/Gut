module.exports = (() => {
  const execSync = require('child_process').execSync;

  const utils = require('./utils');

  return {
    add: () => {
      utils.moveUpTop();
      execSync('git add . -A');
    }
  };
})();
