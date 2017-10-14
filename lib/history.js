module.exports = (() => {
  const _ = require('lodash');

  const utils = require('./utils');

  const ARGUMENTS = {
    FORMAT: {
      name: 'format',
      alias: 'f',
      describe: 'The format name. Defaults to pretty',
      choices: _.keys(utils.LOG_FORMATS),
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
      const arguments = yargs
        .usage('usage: $0 history [options]')
        .option(ARGUMENTS.FORMAT.name, ARGUMENTS.FORMAT)
        .option(ARGUMENTS.SKIP.name, ARGUMENTS.SKIP)
        .option(ARGUMENTS.NUMBER.name, ARGUMENTS.NUMBER)
        .option(ARGUMENTS.REVERSE.name, ARGUMENTS.REVERSE)
        .help()
        .argv;

      const logFormat = utils.LOG_FORMATS[arguments.format];
      const skip = arguments.skip;
      const number = arguments.number;
      const reverse = arguments.reverse;
      const logs = utils.execute(`git log --skip ${skip} -n ${number} ${reverse ? '--reverse' : ''} --pretty=format:'${logFormat.format}'`);
      utils.print(logFormat.postProcessing(logs));
    }
  };
})();
