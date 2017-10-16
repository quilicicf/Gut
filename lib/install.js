const path = require('path');

const execution = require('./utils/execution');
const utils = require('./utils');

module.exports = (() => {
  return {
    install: () => {
      const scriptsPath = utils.SCRIPTS_PATH;
      const pushbPopbScriptPath = path.resolve(__dirname, '../shell/pushbPopb.sh');

      execution.execute(`mkdir -p ${scriptsPath}`);
      execution.execute(`cp ${pushbPopbScriptPath} ${scriptsPath}`);
    }
  };
})();
