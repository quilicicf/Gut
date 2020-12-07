const _ = require('lodash');
const os = require('os');
const utf8 = require('utf8');
const base64 = require('base-64');
const copyPaste = require('copy-paste-win32fix');

const { execSync, exec } = require('child_process');

const execAsync = async (command, options = {}) => new Promise((resolve, reject) => {
  exec(command, options, (error) => {
    if (error) { return reject(error); }
    return resolve();
  });
});

const PLATFORM_OPENERS = {
  linux: 'xdg-open',
  Darwin: 'open', // TODO: is it really Darwin ?
  windows: '???', // TODO: add support for Windows
};

const executeWithOptions = (commandOrCommands, options) => {
  if (_.isArray(commandOrCommands)) {
    return execSync(_.join(commandOrCommands, ';'), options);
  }

  return execSync(commandOrCommands, options);
};

const execute = (commandOrCommands) => executeWithOptions(commandOrCommands).toString();

const executeSilently = (commandOrCommands) => executeWithOptions(commandOrCommands, { stdio: [ 'pipe', 'pipe', 'ignore' ] });

const executeAndPipe = (commandOrCommands) => executeWithOptions(commandOrCommands, { stdio: 'inherit' });

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

const openFile = async (itemToOpen) => {
  const opener = getPlatformOpener();
  return execAsync(`${opener} ${itemToOpen}`, { stdio: [ 'pipe', 'ignore', 'ignore' ] });
};

const openUrl = (url) => {
  const opener = getPlatformOpener();
  execSync(`${opener} ${url}`);
};

const base64Encode = (textToEncode) => base64.encode(utf8.encode(textToEncode));

const copy = async (text, subject) => new Promise((resolve) => {
  copyPaste.copy(text, (error) => {
    if (error) {
      exit(1, `Can't copy '${subject}'`);
    }

    print(`${_.upperFirst(subject)} '${text}' copied to clipboard`.green);
    resolve();
  });
});

module.exports = {
  execute,
  executeSilently,
  executeAndPipe,
  print,
  openFile,
  openUrl,
  exit,
  base64Encode,
  copy,
};
