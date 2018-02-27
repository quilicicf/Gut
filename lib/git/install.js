const _ = require('lodash');

const path = require('path');

const configuration = require('../utils/configuration');
const execution = require('../utils/execution');

const NAME = path.parse(__filename).name;
const ALIASES = [ NAME.charAt(0) ];
const IDENTIFIERS = _.concat(NAME, ALIASES);
const DESCRIPTION = 'Installs the shell scripts';

const installArgs = (yargs) => {
  return yargs.usage(`usage: $0 ${NAME} [options]`);
};

const installCommand = () => {
  const scriptsPath = configuration.SCRIPTS_PATH;
  const initialScriptsPath = path.resolve(__dirname, '../../shell');

  execution.execute([
    `mkdir -p ${scriptsPath}`,
    `cp ${initialScriptsPath}/*.sh ${scriptsPath}`
  ]);
};

module.exports = {
  NAME,
  ALIASES,
  IDENTIFIERS,
  DESCRIPTION,

  builder: installArgs,
  command: installCommand
};
