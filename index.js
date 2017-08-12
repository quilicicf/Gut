#! /usr/bin/env node

/////////////////////
// REQUIRE MODULES //
/////////////////////

const _ = require('lodash');
const colors = require('colors');
const fs = require('fs');
const os = require('os');
const path = require('path');

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

const arguments = process.argv.slice(2);

const actions = {
  clone: arguments => {
    require('./lib/clone.js').clone(gutOptions, arguments);
  },
  groot: () => {
    console.log(`Je s'appelle groot!`);
  }
};

const firstArgument = _.pullAt(arguments, 0)[ 0 ];

if (!firstArgument) {
  console.error(`I need to display some help there, feel free to contribute if you need it.`.red);
  return;
}

actions[ firstArgument ](arguments);
