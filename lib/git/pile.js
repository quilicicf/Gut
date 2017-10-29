const execution = require('../utils/execution');
const git = require('../utils/git');

module.exports = (() => {
  return {
    pile: () => {
      git.moveUpTop();
      execution.execute('git add . -A');
    }
  };
})();
