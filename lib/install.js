module.exports = (() => {
  const path = require('path');
  const utils = require('./utils');

  return {
    install: () => {
      const scriptsPath = utils.SCRIPTS_PATH;
      const pushbPopbScriptPath = path.resolve(__dirname, '../shell/pushbPopb.sh');

      utils.execute(`mkdir -p ${scriptsPath}`);
      utils.execute(`cp ${pushbPopbScriptPath} ${scriptsPath}`);
    }
  };
})();
