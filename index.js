#! /usr/bin/env node

/////////////////////
// REQUIRE MODULES //
/////////////////////

const _ = require('lodash');
const colors = require('colors');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yargs = require('yargs');

//////////////////////
// RETRIEVE OPTIONS //
//////////////////////

const gutOptionsPath = path.resolve(os.homedir(), '.gut-config.json');
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
  .command([ 'add', 'a' ], `Adds all changes in the repository`, yargs => require('./lib/add.js').add())
  .command([ 'branch', 'b' ], `Displays the given remote's branches`, yargs => require('./lib/branch.js').branch(yargs))
  .command([ 'clone', 'cl' ], `Clones a repository`, yargs => require('./lib/clone.js').clone(yargs, gutOptions))
  .command('groot', 'Display a random sentence, in French', () => {
    console.log(`Je s'appelle Groot`);
  })
  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .argv;
