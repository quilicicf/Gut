const _ = require('lodash');
const os = require('os');
const execSync = require('child_process').execSync;
const spawn = require('child_process').spawn;

module.exports = (() => {
  const PLATFORM_OPENERS = {
    linux: 'xdg-open',
    Darwin: 'open', // TODO: is it really Darwin ?
    windows: '???' // TODO: add support for Windows
  };

  const execute = (commandOrCommands) => {
    if (_.isArray(commandOrCommands)) {
      return execSync(_.join(commandOrCommands, ';')).toString();
    }

    return execSync(commandOrCommands).toString();
  };

  const executeAndPipe = (commandOrCommands, args) => {
    if (_.isArray(commandOrCommands)) {
      spawn(_.join(commandOrCommands, ';'), args, { stdio: 'inherit' });
    } else {
      spawn(commandOrCommands, args, { stdio: 'inherit' });
    }
  };

  const print = console.log; // eslint-disable-line no-console

  const exit = (exitCode, message) => {
    if (message) {
      print(exitCode === 0 ? message : message.red);
    }

    process.exit(exitCode);
  };

  const openFile = (fileToOpen) => {
    const platform = os.platform();
    const opener = PLATFORM_OPENERS[ platform ];

    if (opener) {
      execSync(`${opener} ${fileToOpen}`);
    } else {
      throw Error(`Your OS ${platform} is not supported`);
    }
  };

  return {
    execute,
    executeAndPipe,
    print,
    openFile,
    exit
  };
})();
