const _ = require('lodash');
const os = require('os');
const utf8 = require('utf8');
const base64 = require('base-64');

const { execSync, exec } = require('child_process');

const execAsync = async (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error) => {
      if (error) { return reject(error); }
      return resolve();
    });
  });
};

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

const getPlatformOpener = () => {
  const platform = os.platform();
  const opener = PLATFORM_OPENERS[ platform ];

  if (!opener) {
    throw Error(`Your OS ${platform} is not supported`);
  }

  return opener;
};

const openFile = async (fileToOpen) => {
  const opener = getPlatformOpener();
  return execAsync(`${opener} ${fileToOpen}`, { stdio: [ 'pipe', 'ignore', 'ignore' ] });
};

const openUrl = (url) => {
  const opener = getPlatformOpener();
  execSync(`${opener} ${url}`);
};

const base64Encode = (textToEncode) => {
  return base64.encode(utf8.encode(textToEncode));
};

module.exports = {
  execute,
  executeAndPipe,
  print,
  openFile,
  openUrl,
  exit,
  base64Encode
};
