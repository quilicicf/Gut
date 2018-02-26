#! /usr/bin/env node

/* eslint-disable global-require,spaced-comment,no-unused-expressions,max-len */

/*************************
 *     REQUIRE LIBS      *
 ************************/

require('colors');
const yargs = require('yargs');

/*************************
 *  REQUIRE GUT MODULES  *
 ************************/

const audit = require('./lib/git/audit');
const burgeon = require('./lib/git/burgeon');
const configure = require('./lib/git/configure');
const divisions = require('./lib/git/divisions');
const execute = require('./lib/git/execute');
const history = require('./lib/git/history');
const install = require('./lib/git/install');
const obliterate = require('./lib/git/obliterate');
const pile = require('./lib/git/pile');
const replicate = require('./lib/git/replicate');
const sweetch = require('./lib/git/switch');
const thrust = require('./lib/git/thrust');
const undo = require('./lib/git/undo');

const ci = require('./lib/advanced/ci');
const pr = require('./lib/advanced/pr');

const copyBranch = require('./lib/misc/copyBranch');

const jump = require('./lib/git/jump');

/*************************
 *   PROCESS ARGUMENTS   *
 ************************/

yargs
  .usage('usage: $0 <command>')

  // Public methods
  .command(audit.IDENTIFIERS, audit.DESCRIPTION, audit.builder, audit.command)
  .command(burgeon.IDENTIFIERS, burgeon.DESCRIPTION, burgeon.builder, burgeon.command)
  .command(configure.IDENTIFIERS, configure.DESCRIPTION, configure.builder, configure.command)
  .command(divisions.IDENTIFIERS, divisions.DESCRIPTION, divisions.builder, divisions.command)
  .command(execute.IDENTIFIERS, execute.DESCRIPTION, execute.builder, execute.command)
  .command(history.IDENTIFIERS, history.DESCRIPTION, history.builder, history.command)
  .command(install.IDENTIFIERS, install.DESCRIPTION, install.builder, install.command)
  .command(obliterate.IDENTIFIERS, obliterate.DESCRIPTION, obliterate.builder, obliterate.command)
  .command(pile.IDENTIFIERS, pile.DESCRIPTION, pile.builder, pile.command)
  .command(replicate.IDENTIFIERS, replicate.DESCRIPTION, replicate.builder, replicate.command)
  .command(sweetch.IDENTIFIERS, sweetch.DESCRIPTION, sweetch.builder, sweetch.command)
  .command(thrust.IDENTIFIERS, thrust.DESCRIPTION, thrust.builder, thrust.command)
  .command(undo.IDENTIFIERS, undo.DESCRIPTION, undo.builder, undo.command)

  // Advanced/integration features
  .command(ci.IDENTIFIERS, ci.DESCRIPTION, ci.builder, ci.command)
  .command(pr.IDENTIFIERS, pr.DESCRIPTION, pr.builder, pr.command)

  // Miscellaneous
  .command(copyBranch.IDENTIFIERS, copyBranch.DESCRIPTION, copyBranch.builder, copyBranch.command)

  // To check that Gut is installed or just mess around
  .command('groot', 'Display a random sentence, in French', () => process.stdout.write('Je s\'appelle Groot\n'))

  // Undocumented methods (used in scripts for example, only interesting to developers
  .command(jump.IDENTIFIERS, jump.DESCRIPTION, jump.builder, jump.command)

  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .version()
  .wrap(null)
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md')
  .argv;
