const _ = require('lodash');
const os = require('os');
const utf8 = require('utf8');
const base64 = require('base-64');

const { execSync } = require('child_process');

module.exports = (() => {
  const PLATFORM_OPENERS = {
    linux: 'xdg-open',
    Darwin: 'open', // TODO: is it really Darwin ?
    windows: '???' // TODO: add support for Windows
  };

  const executeWithOptions = (commandOrCommands, options) => {
    if (_.isArray(commandOrCommands)) {
      return execSync(_.join(commandOrCommands, ';'), options);
    }

    return execSync(commandOrCommands, options);
  };

  const execute = (commandOrCommands) => {
    return executeWithOptions(commandOrCommands).toString();
  };

  const executeAndPipe = (commandOrCommands) => {
    return executeWithOptions(commandOrCommands, { stdio: 'inherit' });
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
      execSync(`${opener} ${fileToOpen} &> /dev/null`);
    } else {
      throw Error(`Your OS ${platform} is not supported`);
    }
  };

  const base64Encode = (textToEncode) => {
    return base64.encode(utf8.encode(textToEncode));
  };

  return {
    execute,
    executeAndPipe,
    print,
    openFile,
    exit,
    base64Encode
  };
})();
