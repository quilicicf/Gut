const path = require('path');

const configuration = require('../../utils/configuration');
const execution = require('../../utils/execution');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Installs the shell scripts';

const installArgs = (yargs) => {
  return yargs.usage(`usage: gut ${command} [options]`);
};

const installHandler = () => {
  const scriptsPath = configuration.SCRIPTS_PATH;
  const initialScriptsPath = path.resolve(__dirname, '../../shell');

  execution.execute([
    `mkdir -p ${scriptsPath}`,
    `cp ${initialScriptsPath}/*.sh ${scriptsPath}`
  ]);
};

module.exports = {
  command,
  aliases,
  describe,
  builder: installArgs,
  handler: installHandler
};
