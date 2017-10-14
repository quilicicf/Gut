const utils = require('./utils');

module.exports = (() => {
  return {
    pile: () => {
      utils.moveUpTop();
      utils.execute('git add . -A');
    }
  };
})();
