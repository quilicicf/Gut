#! /usr/bin/env node

/* eslint-disable global-require,spaced-comment,no-unused-expressions */

/*********************
 *  REQUIRE MODULES  *
 ********************/

require('colors');
const os = require('os');
const yargs = require('yargs');

/***********************
 *  PROCESS ARGUMENTS  *
 **********************/

yargs
  .usage('usage: $0 <command>')

  // Public methods
  .command([ 'audit', 'a' ], 'Audits a given diff', (_yargs) => require('./lib/git/audit').audit(_yargs, os))
  .command([ 'burgeon', 'b' ], 'Creates a branch', (_yargs) => require('./lib/git/burgeon').burgeon(_yargs, os))
  .command([ 'configure', 'c' ], 'Guides you to create/replace your configuration file', () => require('./lib/git/configure').changeConfiguration())
  .command([ 'divisions', 'd' ], 'Displays the given remote\'s branches', (_yargs) => require('./lib/git/divisions').divisions(_yargs))
  .command([ 'execute', 'e' ], 'Commits the staged changes', (_yargs) => require('./lib/git/execute').execute(_yargs))
  .command([ 'history', 'h' ], 'Displays the commit\'s history', (_yargs) => require('./lib/git/history').history(_yargs))
  .command([ 'install', 'i' ], 'Installs the shell scripts', () => require('./lib/git/install').install())
  .command([ 'obliterate', 'o' ], 'Deletes a branch or a tag', (_yargs) => require('./lib/git/obliterate').obliterate(_yargs))
  .command([ 'pile', 'p' ], 'Adds all changes in the repository', () => require('./lib/git/pile').pile())
  .command([ 'replicate', 'r' ], 'Clones a repository', (_yargs) => require('./lib/git/replicate').replicate(_yargs))
  .command([ 'switch', 's' ], 'Checks out a branch', (_yargs) => require('./lib/git/switch').switch(_yargs))
  .command([ 'thrust', 't' ], 'Pushes local changes to a remote', (_yargs) => require('./lib/git/thrust').thrust(_yargs))
  .command([ 'undo', 'u' ], 'Undoes commits', (_yargs) => require('./lib/git/undo').undo(_yargs))

  // Advanced/integration features
  .command('ci', 'Interact with your CI tool', () => require('./lib/advanced/ci').ci())
  .command('pr', 'Creates a pull request on your git server', () => require('./lib/advanced/pr').pr())

  // Miscellaneous
  .command([ 'copy-branch', 'cb' ], 'Copies the current branch name to the clipboard', () => require('./lib/misc/copyBranch').copyBranch())

  // To check that Gut is installed or just mess around
  .command('groot', 'Display a random sentence, in French', () => require('./lib/utils/execution').print('Je s\'appelle Groot'))

  // Undocumented methods (used in scripts for example, only interesting to developers
  .command('jump', false, _yargs => require('./lib/git/jump').jump(_yargs))

  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .version()
  .wrap(null)
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md')
  .argv;
