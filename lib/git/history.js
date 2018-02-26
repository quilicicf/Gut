const _ = require('lodash');

const path = require('path');

const branches = require('../utils/branches');
const execution = require('../utils/execution');

const NAME = path.parse(__filename).name;
const ALIASES = [ NAME.charAt(0) ];
const IDENTIFIERS = _.concat(NAME, ALIASES);
const DESCRIPTION = 'Displays the commit\'s history';

const ARG_FORMAT = {
  name: 'format',
  alias: 'f',
  describe: 'The format name. Defaults to pretty',
  choices: _.keys(branches.LOG_FORMATS),
  type: 'string',
  default: 'pretty'
};

const ARG_SKIP = {
  name: 'skip',
  alias: 's',
  describe: 'Skip n commits before starting to show the commit output',
  type: 'integer',
  default: 0
};

const ARG_NUMBER = {
  name: 'number',
  alias: 'n',
  describe: 'Limit the number of commits to output',
  type: 'integer',
  default: 100
};

const ARG_REVERSE = {
  name: 'reverse',
  alias: 'r',
  describe: 'Output the commits chosen to be shown in reverse order.',
  type: 'boolean',
  default: false
};

const historyArgs = (yargs) => {
  return yargs
    .usage(`usage: $0 ${path.parse(__filename).name} [options]`)
    .option(ARG_FORMAT.name, ARG_FORMAT)
    .option(ARG_SKIP.name, ARG_SKIP)
    .option(ARG_NUMBER.name, ARG_NUMBER)
    .option(ARG_REVERSE.name, ARG_REVERSE)
    .help();
};

const historyCommand = (args) => {
  const logFormat = branches.LOG_FORMATS[ args.format ];
  const skip = args.skip;
  const number = args.number;
  const reverse = args.reverse;

  const logCommand = `git log --skip ${skip} -n ${number} ${reverse ? '--reverse' : ''} --pretty=format:'${logFormat.format}'`;
  if (logFormat.postProcessing) {
    const logs = execution.execute(logCommand);
    execution.print(logFormat.postProcessing(logs));
  } else {
    execution.executeAndPipe(logCommand);
  }
};

module.exports = {
  NAME,
  ALIASES,
  IDENTIFIERS,
  DESCRIPTION,

  ARG_FORMAT,
  ARG_NUMBER,
  ARG_REVERSE,
  ARG_SKIP,

  builder: historyArgs,
  command: historyCommand
};
