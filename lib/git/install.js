const path = require('path');

const configuration = require('../utils/configuration');
const execution = require('../utils/execution');

module.exports = (() => {
  return {
    install: () => {
      const scriptsPath = configuration.SCRIPTS_PATH;
      const initialScriptsPath = path.resolve(__dirname, '../../shell');

      execution.execute([
        `mkdir -p ${scriptsPath}`,
        `cp ${initialScriptsPath}/*.sh ${scriptsPath}`
      ]);
    }
  };
})();
