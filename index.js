#! /usr/bin/env node

/////////////////////
// REQUIRE MODULES //
/////////////////////

require('colors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yargs = require('yargs');

const utils = require('./lib/utils');

//////////////////////
// RETRIEVE OPTIONS //
//////////////////////

const gutOptionsPath = path.resolve(os.homedir(), utils.OPTIONS_FILE_NAME);
let gutOptions;
try {
  fs.statSync(gutOptionsPath);
  gutOptions = JSON.parse(fs.readFileSync(gutOptionsPath, 'utf8'));
} catch (err) {
  gutOptions = require('./lib/init.js').init(gutOptionsPath);
}

///////////////////////
// PROCESS ARGUMENTS //
///////////////////////

yargs
  .usage('usage: $0 <command>')
  .command([ 'add', 'a' ], `Adds all changes in the repository`, yargs => require('./lib/add').add())
  .command([ 'branch', 'b' ], `Displays the given remote's branches`, yargs => require('./lib/branch').branch(yargs))
  .command([ 'checkout', 'co' ], `Checks out a branch`, yargs => require('./lib/checkout').checkout(yargs, gutOptions))
  .command([ 'clone', 'cl' ], `Clones a repository`, yargs => require('./lib/clone').clone(yargs, gutOptions))
  .command([ 'commit', 'c' ], `Commits the staged changes`, yargs => require('./lib/commit').commit(yargs))
  .command([ 'inspect', 'i' ], `Displays impacts on code base`, yargs => require('./lib/inspect').inspect(yargs, os))
  .command([ 'log', 'l' ], `Displays the commit's history`, yargs => require('./lib/log').log(yargs))
  .command([ 'push', 'p' ], `Pushes local changes to a remote`, yargs => require('./lib/push').push(yargs))
  .command('groot', 'Display a random sentence, in French', () => {
    utils.print(`Je s'appelle Groot`);
  })
  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .version()
  .wrap(null)
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/specs.md')
  .argv;
