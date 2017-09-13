module.exports = (() => {
  const utils = require('./utils');

  return {
    add: () => {
      utils.moveUpTop();
      utils.execute('git add . -A');
    }
  };
})();
