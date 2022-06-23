import log from './src/dependencies/log.ts';
import { yargs, YargsInstance } from './src/dependencies/yargs.ts';
import { stoyleGlobal, theme } from './src/dependencies/stoyle.ts';

import { getConfiguration } from './src/configuration.ts';

import * as groot from './src/groot.ts';

import * as pile from './src/commands/simple/pile.ts';
import * as undo from './src/commands/simple/undo.ts';
import * as audit from './src/commands/simple/audit.ts';
import * as yield_ from './src/commands/simple/yield.ts';
import * as thrust from './src/commands/simple/thrust.ts';
import * as switchy from './src/commands/simple/switch.ts';
import * as burgeon from './src/commands/simple/burgeon.ts';
import * as execute from './src/commands/simple/execute.ts';
import * as history from './src/commands/simple/history.ts';
import * as replicate from './src/commands/simple/replicate.ts';
import * as divisions from './src/commands/simple/divisions.ts';
import * as obliterate from './src/commands/simple/obliterate.ts';

import * as jump from './src/commands/internals/jump.ts';
import * as install from './src/commands/internals/install.ts';

import * as autoRebase from './src/commands/advanced/auto-rebase/auto-rebase.ts';
import * as copyBranch from './src/commands/advanced/copy-branch/copy-branch.ts';
import * as pullRequest from './src/commands/advanced/pull-request/pull-request.ts';
import * as switchDefault from './src/commands/advanced/switch-default/switch-default.ts';
import * as pruneLocalBranches from './src/commands/advanced/prune-local-branches/prune-local-branches.ts';

// Install with:
// deno install \
//   --unstable \
//   --allow-env=HOME \
//   --allow-net=api.github.com \
//   --allow-read="${FORGE},${HOME}/.config/gut/" \
//   --allow-write="${HOME}/.config/gut/" \
//   --allow-run=git,micro,xclip,xdg-open \
//   --name g \
//   --no-check \
//   --no-prompt \
//   --force \
//   mod.ts
const main = async () => {
  const yargsInstance: YargsInstance = yargs;
  const configuration = await getConfiguration();

  yargsInstance
    .usage('usage: gut <command>')
    .option('configuration', {
      default: configuration,
      type: 'string',
      global: true,
      hidden: true,
    })

    // Public commands
    .command(audit)
    .command(burgeon)
    .command(divisions)
    .command(execute)
    .command(history)
    .command(obliterate)
    .command(pile)
    .command(replicate)
    .command(switchy)
    .command(thrust)
    .command(undo)
    .command(yield_)

    // Advanced commands
    .command(autoRebase)
    .command(copyBranch)
    .command(pruneLocalBranches)
    .command(pullRequest)
    .command(switchDefault)

    // Internals
    .command(jump)
    .command(install)

    // To check that Gut is installed or just mess around
    .command(groot)

    .demandCommand(1, stoyleGlobal`Specify the command you want to run!`(theme.error))
    .strictCommands()
    .help()
    .version()
    .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut')
    .wrap(null)
    .parse(Deno.args);
};

main()
  .catch(async (error) => {
    await log(Deno.stderr, error.message); // TODO: better error handling?
  });
