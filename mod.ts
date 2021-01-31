import log from './src/dependencies/log.ts';
import { yargs } from './src/dependencies/yargs.ts';
import install from './src/commands/internals/install.ts';
import { applyStyle, theme } from './src/dependencies/colors.ts';

import { getConfiguration } from './src/configuration.ts';

import * as pile from './src/commands/simple/pile.ts';
import * as audit from './src/commands/simple/audit.ts';
import * as thrust from './src/commands/simple/thrust.ts';
import * as burgeon from './src/commands/simple/burgeon.ts';
import * as execute from './src/commands/simple/execute.ts';
import * as history from './src/commands/simple/history.ts';
import * as replicate from './src/commands/simple/replicate.ts';
import * as divisions from './src/commands/simple/divisions.ts';

// Install with: deno install --allow-run --allow-read="$FORGE" --name gd index.ts
const main = async () => {
  const yargsInstance: any = yargs();
  const configuration = await getConfiguration();

  yargsInstance
    .usage('usage: gut <command>')
    .option('configuration', {
      default: configuration,
      type: 'string',
      global: true,
      hidden: true,
    })

    // Public methods
    .command(audit)
    .command(burgeon)
    .command(divisions)
    .command(execute)
    .command(history)
    .command(pile)
    .command(replicate)
    .command(thrust)

    // Internals
    .command(install)

    // To check that Gut is installed or just mess around
    .command('groot', 'Display a random sentence, in French', () => log(Deno.stdout, 'Je s\'appelle Groot\n'))

    .demandCommand(1, applyStyle('Specify the command you want to run!', [ theme.error ]))
    .strictCommands()
    .help()
    .version()
    .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md')
    .parse(Deno.args);
};

main()
  .catch(async (error) => {
    await log(Deno.stderr, error.message); // TODO: better error handling?
  });
