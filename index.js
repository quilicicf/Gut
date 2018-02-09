#! /usr/bin/env node

/* eslint-disable global-require,spaced-comment,no-unused-expressions */

/*************************
 *     REQUIRE LIBS      *
 ************************/

require('colors');
const os = require('os');
const yargs = require('yargs');

/*************************
 *  REQUIRE GUT MODULES  *
 ************************/

const { auditArgs, auditCommand } = require('./lib/git/audit');
const { burgeonArgs, burgeonCommand } = require('./lib/git/burgeon');
const { changeConfiguration } = require('./lib/git/configure');
const { divisionsArgs, divisionsCommand } = require('./lib/git/divisions');
const { executeArgs, executeCommand } = require('./lib/git/execute');
const { historyArgs, historyCommand } = require('./lib/git/history');
const { install } = require('./lib/git/install');
const { obliterateArgs, obliterateCommand } = require('./lib/git/obliterate');
const { pile } = require('./lib/git/pile');
const { replicateArgs, replicateCommand } = require('./lib/git/replicate');
const { thrustArgs, thrustCommand } = require('./lib/git/thrust');
const { jumpArgs, jumpCommand } = require('./lib/git/jump');
const { switchArgs, switchCommand } = require('./lib/git/switch');
const { undoArgs, undoCommand } = require('./lib/git/undo');

const { ci } = require('./lib/advanced/ci');
const { pr } = require('./lib/advanced/pr');

const { copyBranch } = require('./lib/misc/copyBranch');

/*************************
 *   PROCESS ARGUMENTS   *
 ************************/

yargs
  .usage('usage: $0 <command>')

  // Public methods
  .command([ 'audit', 'a' ], 'Audits a given diff', (_yargs) => auditArgs(_yargs), (_args) => auditCommand(_args, os))
  .command([ 'burgeon', 'b' ], 'Creates a branch', (_yargs) => burgeonArgs(_yargs), async (_args) => burgeonCommand(_args, os))
  .command([ 'configure', 'c' ], 'Guides you to create/replace your configuration file', () => {}, changeConfiguration)
  .command([ 'divisions', 'd' ], 'Displays the given remote\'s branches', (_yargs) => divisionsArgs(_yargs), (_args) => divisionsCommand(_args))
  .command([ 'execute', 'e' ], 'Commits the staged changes', (_yargs) => executeArgs(_yargs), (_args) => executeCommand(_args))
  .command([ 'history', 'h' ], 'Displays the commit\'s history', (_yargs) => historyArgs(_yargs), (_args) => historyCommand(_args))
  .command([ 'install', 'i' ], 'Installs the shell scripts', () => {}, install)
  .command([ 'obliterate', 'o' ], 'Deletes a branch or a tag', (_yargs) => obliterateArgs(_yargs), async (_args) => obliterateCommand(_args))
  .command([ 'pile', 'p' ], 'Adds all changes in the repository', () => {}, pile)
  .command([ 'replicate', 'r' ], 'Clones a repository', (_yargs) => replicateArgs(_yargs), async (_args) => replicateCommand(_args))
  .command([ 'switch', 's' ], 'Checks out a branch', (_yargs) => switchArgs(_yargs), async (_args) => switchCommand(_args))
  .command([ 'thrust', 't' ], 'Pushes local changes to a remote', (_yargs) => thrustArgs(_yargs), (_args) => thrustCommand(_args))
  .command([ 'undo', 'u' ], 'Undoes commits', (_yargs) => undoArgs(_yargs), async (_args) => undoCommand(_args))

  // Advanced/integration features
  .command('ci', 'Interact with your CI tool', () => {}, ci)
  .command('pr', 'Creates a pull request on your git server', () => {}, pr)

  // Miscellaneous
  .command([ 'copy-branch', 'cb' ], 'Copies the current branch name to the clipboard', () => {}, copyBranch)

  // To check that Gut is installed or just mess around
  .command('groot', 'Display a random sentence, in French', () => require('./lib/utils/execution').print('Je s\'appelle Groot'))

  // Undocumented methods (used in scripts for example, only interesting to developers
  .command('jump', false, (_yargs) => jumpArgs(_yargs), async (_args) => jumpCommand(_args))

  .demandCommand(1, 'Specify the command you want to run!'.red)
  .help()
  .version()
  .wrap(null)
  .epilogue('For more information, read the manual at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md')
  .argv;
