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
  .command([ 'audit', 'a' ], `Audits a given diff`, yargs => require('./lib/audit').audit(yargs, os))
  .command([ 'divisions', 'd' ], `Displays the given remote's branches`, yargs => require('./lib/divisions').divisions(yargs))
  .command([ 'execute', 'e' ], `Commits the staged changes`, yargs => require('./lib/execute').execute(yargs))
  .command([ 'history', 'h' ], `Displays the commit's history`, yargs => require('./lib/history').history(yargs))
  .command([ 'obliterate', 'o' ], `Deletes an item (branch, tag, stash entry)`, yargs => require('./lib/obliterate').obliterate(yargs))
  .command([ 'pile', 'p' ], `Adds all changes in the repository`, yargs => require('./lib/pile').pile())
  .command([ 'replicate', 'r' ], `Clones a repository`, yargs => require('./lib/replicate').replicate(yargs, gutOptions))
  .command([ 'switch', 's' ], `Checks out a branch`, yargs => require('./lib/switch').switch(yargs, gutOptions))
  .command([ 'thrust', 't' ], `Pushes local changes to a remote`, yargs => require('./lib/thrust').thrust(yargs))
  .command('groot', 'Display a random sentence, in French', () => {
    utils.print(`Je s'appelle Groot`);
  })
  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .version()
  .wrap(null)
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/specs.md')
  .argv;
