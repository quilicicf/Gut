const _ = require('lodash');

const path = require('path');

const { execute } = require('../../utils/execution');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Fetches from git server';

const ARG_REMOTE = {
  name: 'remote',
  alias: 'r',
  describe: 'The remote to fetch',
  type: 'string'
};

const fetchArgs = (yargs) => (
  yargs.usage(`usage: gut ${command} [options]`)
    .option(ARG_REMOTE.name, ARG_REMOTE)
    .help()
);

const fetchHandler = (args) => {
  const { [ ARG_REMOTE.name ]: remote } = args;
  execute(`git fetch ${remote || 'origin'}`);
};

module.exports = {
  command,
  aliases,
  describe,
  description: describe,
  builder: fetchArgs,
  handler: fetchHandler
};
