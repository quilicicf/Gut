const _ = require('lodash');

const path = require('path');

const branches = require('../../utils/branches');
const execution = require('../../utils/execution');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Displays the commit\'s history';

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
  const ALL_ARGUMENTS = [
    ARG_FORMAT,
    ARG_SKIP,
    ARG_NUMBER,
    ARG_REVERSE
  ];

  return yargs
    .usage(`usage: gut ${path.parse(__filename).name} [options]`)
    .options(_.keyBy(ALL_ARGUMENTS, 'name'))
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
  ARG_FORMAT,
  ARG_NUMBER,
  ARG_REVERSE,
  ARG_SKIP,

  command,
  aliases,
  describe,
  builder: historyArgs,
  handler: historyCommand
};
