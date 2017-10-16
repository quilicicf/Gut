const execution = require('./utils/execution');
const utils = require('./utils');

module.exports = (() => {
  return {
    pile: () => {
      utils.moveUpTop();
      execution.execute('git add . -A');
    }
  };
})();
