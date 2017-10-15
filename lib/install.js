const path = require('path');

const configuration = require('./utils/configuration');
const execution = require('./utils/execution');

module.exports = (() => {
  return {
    install: () => {
      const scriptsPath = configuration.SCRIPTS_PATH;
      const pushbPopbScriptPath = path.resolve(__dirname, '../shell/pushbPopb.sh');

      execution.execute(`mkdir -p ${scriptsPath}`);
      execution.execute(`cp ${pushbPopbScriptPath} ${scriptsPath}`);
    }
  };
})();
