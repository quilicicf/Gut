module.exports = (() => {
  const execSync = require('child_process').execSync;
  const spawn = require('child_process').spawn;

  const execute = command => {
    return execSync(command).toString();
  };

  const executeAndPipe = (command, arguments) => {
    spawn(command, arguments, { stdio: 'inherit' });
  };

  const print = console.log;

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
