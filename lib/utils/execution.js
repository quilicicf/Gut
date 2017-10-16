const execSync = require('child_process').execSync;
const spawn = require('child_process').spawn;

module.exports = (() => {
  const execute = command => {
    return execSync(command).toString();
  };

  const executeAndPipe = (command, args) => {
    spawn(command, args, { stdio: 'inherit' });
  };

  const print = console.log; // eslint-disable-line no-console

  const exit = (message, exitCode) => {
    print(exitCode === 0 ? message.green : message.red);
    process.exit(exitCode);
  };

  return {
    execute,
    executeAndPipe,
    print,
    exit
  };
})();
