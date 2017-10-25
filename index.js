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
  .command([ 'audit', 'a' ], 'Audits a given diff', (_yargs) => require('./lib/audit').audit(_yargs, os))
  .command([ 'burgeon', 'b' ], 'Creates a branch', (_yargs) => require('./lib/burgeon').burgeon(_yargs, os))
  .command([ 'configure', 'c' ], 'Guides you to create/replace your configuration file', () => require('./lib/configure').changeConfiguration())
  .command([ 'divisions', 'd' ], 'Displays the given remote\'s branches', (_yargs) => require('./lib/divisions').divisions(_yargs))
  .command([ 'execute', 'e' ], 'Commits the staged changes', (_yargs) => require('./lib/execute').execute(_yargs))
  .command([ 'history', 'h' ], 'Displays the commit\'s history', (_yargs) => require('./lib/history').history(_yargs))
  .command([ 'install', 'i' ], 'Installs the shell scripts', () => require('./lib/install').install())
  .command([ 'obliterate', 'o' ], 'Deletes a branch or a tag', (_yargs) => require('./lib/obliterate').obliterate(_yargs))
  .command([ 'pile', 'p' ], 'Adds all changes in the repository', () => require('./lib/pile').pile())
  .command([ 'query-review', 'q' ], 'Creates a pull request on your git server', () => require('./lib/query').query())
  .command([ 'replicate', 'r' ], 'Clones a repository', (_yargs) => require('./lib/replicate').replicate(_yargs))
  .command([ 'switch', 's' ], 'Checks out a branch', (_yargs) => require('./lib/switch').switch(_yargs))
  .command([ 'thrust', 't' ], 'Pushes local changes to a remote', (_yargs) => require('./lib/thrust').thrust(_yargs))

  // To check that Gut is installed or just mess around
  .command('groot', 'Display a random sentence, in French', () => console.log('Je s\'appelle Groot'))

  // Undocumented methods (used in scripts for example, only interesting to developers
  .command('jump', false, _yargs => require('./lib/jump').jump(_yargs))

  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .version()
  .wrap(null)
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/specs.md')
  .parse(process.argv.slice(2));
