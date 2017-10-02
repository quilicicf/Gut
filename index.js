#! /usr/bin/env node

/////////////////////
// REQUIRE MODULES //
/////////////////////

require('colors');
const os = require('os');
const yargs = require('yargs');

///////////////////////
// PROCESS ARGUMENTS //
///////////////////////

yargs
  .usage('usage: $0 <command>')
  .command([ 'audit', 'a' ], `Audits a given diff`, yargs => require('./lib/audit').audit(yargs, os))
  .command([ 'burgeon', 'b' ], `Creates a branch`, yargs => require('./lib/burgeon').burgeon(yargs, os))
  .command([ 'configure', 'c' ], `Guides you to create/replace your configuration file`, yargs => require('./lib/configure').changeConfiguration())
  .command([ 'divisions', 'd' ], `Displays the given remote's branches`, yargs => require('./lib/divisions').divisions(yargs))
  .command([ 'execute', 'e' ], `Commits the staged changes`, yargs => require('./lib/execute').execute(yargs))
  .command([ 'history', 'h' ], `Displays the commit's history`, yargs => require('./lib/history').history(yargs))
  .command([ 'install', 'i' ], `Installs the shell scripts`, yargs => require('./lib/install').install())
  .command([ 'obliterate', 'o' ], `Deletes a branch or a tag`, yargs => require('./lib/obliterate').obliterate(yargs))
  .command([ 'pile', 'p' ], `Adds all changes in the repository`, yargs => require('./lib/pile').pile())
  .command([ 'replicate', 'r' ], `Clones a repository`, yargs => require('./lib/replicate').replicate(yargs))
  .command([ 'switch', 's' ], `Checks out a branch`, yargs => require('./lib/switch').switch(yargs))
  .command([ 'thrust', 't' ], `Pushes local changes to a remote`, yargs => require('./lib/thrust').thrust(yargs))
  .command('groot', 'Display a random sentence, in French', () => console.log(`Je s'appelle Groot`))
  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .version()
  .wrap(null)
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/specs.md')
  .argv;
