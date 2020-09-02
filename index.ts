import { red } from 'https://deno.land/std/fmt/colors.ts';
import { Yargs, YargsType, Arguments } from 'https://deno.land/x/yargs/deno.ts';

import pile from './src/commands/simple/pile.ts';

import log from './src/utils/log.ts';

// Install with: deno install --allow-run --allow-read="$FORGE" --name gd index.ts
Yargs()
  .usage('usage: gut <command>')

  // Public methods
  .command(pile)

  // To check that Gut is installed or just mess around
  .command('groot', 'Display a random sentence, in French', () => log(Deno.stdout, 'Je s\'appelle Groot\n'))

  .demandCommand(1, red('Specify the command you want to run!'))
  .strictCommands()
  .help()
  .version()
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md')
  .parse(Deno.args);
