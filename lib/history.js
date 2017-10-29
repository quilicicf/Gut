const _ = require('lodash');

const branches = require('./utils/branches');
const execution = require('./utils/execution');

module.exports = (() => {
  const ARGUMENTS = {
    FORMAT: {
      name: 'format',
      alias: 'f',
      describe: 'The format name. Defaults to pretty',
      choices: _.keys(branches.LOG_FORMATS),
      type: 'string',
      default: 'pretty'
    },
    SKIP: {
      name: 'skip',
      alias: 's',
      describe: 'Skip n commits before starting to show the commit output',
      type: 'integer',
      default: 0
    },
    NUMBER: {
      name: 'number',
      alias: 'n',
      describe: 'Limit the number of commits to output',
      type: 'integer',
      default: 100
    },
    REVERSE: {
      name: 'reverse',
      alias: 'r',
      describe: 'Output the commits chosen to be shown in reverse order.',
      type: 'boolean',
      default: false
    }
  };

  return {
    history: yargs => {
      const args = yargs
        .usage('usage: $0 history [options]')
        .option(ARGUMENTS.FORMAT.name, ARGUMENTS.FORMAT)
        .option(ARGUMENTS.SKIP.name, ARGUMENTS.SKIP)
        .option(ARGUMENTS.NUMBER.name, ARGUMENTS.NUMBER)
        .option(ARGUMENTS.REVERSE.name, ARGUMENTS.REVERSE)
        .help()
        .argv;

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
    }
  };
})();
