import log from './src/dependencies/log.ts';
import { yargs } from './src/dependencies/yargs.ts';
import install from './src/commands/internals/install.ts';
import { __, applyStyle, theme } from './src/dependencies/colors.ts';

import pile from './src/commands/simple/pile.ts';
import history from './src/commands/simple/history.ts';
import divisions from './src/commands/simple/divisions.ts';

// Install with: deno install --allow-run --allow-read="$FORGE" --name gd index.ts
yargs()
  .usage('usage: gut <command>')

  // Public methods
  .command(divisions)
  .command(history)
  .command(pile)

  // Internals
  .command(install)

  // To check that Gut is installed or just mess around
  .command('groot', 'Display a random sentence, in French', () => log(Deno.stdout, 'Je s\'appelle Groot\n'))

  .demandCommand(1, applyStyle(__`Specify the command you want to run!`, [ theme.error ]))
  .strictCommands()
  .help()
  .version()
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md')
  .parse(Deno.args);
