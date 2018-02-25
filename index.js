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

const commands = require('./lib/commands');
const replicate = require('./lib/git/replicate');

/*************************
 *   PROCESS ARGUMENTS   *
 ************************/

yargs
  .usage('usage: $0 <command>')

  // Public methods
  .command(commands.audit.identifiers(), commands.audit.description, commands.audit.builder, commands.audit.command)
  .command(commands.burgeon.identifiers(), commands.burgeon.description, commands.burgeon.builder, commands.burgeon.command)
  .command(commands.configure.identifiers(), commands.configure.description, commands.configure.builder, commands.configure.command)
  .command(commands.divisions.identifiers(), commands.divisions.description, commands.divisions.builder, commands.divisions.command)
  .command(commands.execute.identifiers(), commands.execute.description, commands.execute.builder, commands.execute.command)
  .command(commands.history.identifiers(), commands.history.description, commands.history.builder, commands.history.command)
  .command(commands.install.identifiers(), commands.install.description, commands.install.builder, commands.install.command)
  .command(commands.obliterate.identifiers(), commands.obliterate.description, commands.obliterate.builder, commands.obliterate.command)
  .command(commands.pile.identifiers(), commands.pile.description, commands.pile.builder, commands.pile.command)
  .command(replicate.IDENTIFIERS, replicate.DESCRIPTION, replicate.builder, replicate.command)
  .command(commands.switch.identifiers(), commands.switch.description, commands.switch.builder, commands.switch.command)
  .command(commands.thrust.identifiers(), commands.thrust.description, commands.thrust.builder, commands.thrust.command)
  .command(commands.undo.identifiers(), commands.undo.description, commands.undo.builder, commands.undo.command)

  // Advanced/integration features
  .command(commands.ci.identifiers(), commands.ci.description, commands.ci.builder, commands.ci.command)
  .command(commands.pr.identifiers(), commands.pr.description, commands.pr.builder, commands.pr.command)

  // Miscellaneous
  .command(commands.copyBranch.identifiers(), commands.copyBranch.description, commands.copyBranch.builder, commands.copyBranch.command)

  // To check that Gut is installed or just mess around
  .command('groot', 'Display a random sentence, in French', () => process.stdout.write('Je s\'appelle Groot\n'))

  // Undocumented methods (used in scripts for example, only interesting to developers
  .command(commands.copyBranch.identifiers(), commands.copyBranch.description, commands.copyBranch.builder, commands.copyBranch.command)

  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .version()
  .wrap(null)
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md')
  .argv;
