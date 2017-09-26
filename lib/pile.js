module.exports = (() => {
  const utils = require('./utils');

  return {
    pile: () => {
      utils.moveUpTop();
      utils.execute('git add . -A');
    }
  };
})();
