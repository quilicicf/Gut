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

// noinspection BadExpressionStatementJS
/*************************
 *   PROCESS ARGUMENTS   *
 ************************/

yargs
  .usage('usage: gut <command>')

  // Public methods
  .command(require('./lib/commands/git/audit'))
  .command(require('./lib/commands/git/burgeon'))
  .command(require('./lib/commands/git/divisions'))
  .command(require('./lib/commands/git/execute'))
  .command(require('./lib/commands/git/history'))
  .command(require('./lib/commands/git/obliterate'))
  .command(require('./lib/commands/git/pile'))
  .command(require('./lib/commands/git/replicate'))
  .command(require('./lib/commands/git/switch'))
  .command(require('./lib/commands/git/thrust'))
  .command(require('./lib/commands/git/undo'))

  // Advanced/integration features
  .command(require('./lib/commands/advanced/ci'))
  .command(require('./lib/commands/advanced/pr'))

  // Miscellaneous
  .command(require('./lib/commands/misc/configure'))
  .command(require('./lib/commands/misc/copyBranch'))
  .command(require('./lib/commands/misc/install'))

  // To check that Gut is installed or just mess around
  .command('groot', 'Display a random sentence, in French', () => process.stdout.write('Je s\'appelle Groot\n'))

  // Undocumented methods (used in scripts for example, only interesting to developers)
  .command(require('./lib/commands/hidden/jump'))

  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .version()
  .wrap(null)
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md')
  .argv;
