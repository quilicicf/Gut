const path = require('path');

const { getCurrentBranchName } = require('../../utils/branches');
const { executeAndPipe, print } = require('../../utils/execution');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Fetches from git server';

const QUESTIONS = {
  CONFIRM_FORCE_PULL: 'lib/git/yield:confirm_force_pull',
};

const ARG_REMOTE = {
  name: 'remote',
  alias: 'r',
  describe: 'The remote to fetch',
  type: 'string',
  default: 'origin',
};

const ARG_PULL = {
  name: 'pull',
  alias: 'p',
  describe: 'Whether the remote branch should be pulled',
  type: 'boolean',
};

const ARG_FORCE = {
  name: 'force',
  alias: 'f',
  describe: 'Whether the pulling of a branch should be forced or not',
  type: 'boolean',
};

const QUESTION_CONFIRM_FORCE_PULL = {
  type: QUESTION_TYPES.BOOLEAN,
  id: QUESTIONS.CONFIRM_FORCE_PULL,
  message: 'Do you want to overwrite your local branch ?',
  default: false,
};

const fetchArgs = yargs => (
  yargs.usage(`usage: gut ${command} [options]`)
    .option(ARG_REMOTE.name, ARG_REMOTE)
    .option(ARG_PULL.name, ARG_PULL)
    .option(ARG_FORCE.name, ARG_FORCE)
    .implies(ARG_FORCE.name, ARG_PULL.name)
    .help()
);

const fetchHandler = async (args) => {
  const {
    [ ARG_REMOTE.name ]: remote,
    [ ARG_PULL.name ]: shouldPull,
    [ ARG_FORCE.name ]: isForcePull,
  } = args;
  const currentBranchName = getCurrentBranchName();

  print(`Fetching ${remote}`);
  executeAndPipe(`git fetch ${remote}`);

  if (shouldPull && isForcePull) {
    const shouldForcePull = await ask(QUESTION_CONFIRM_FORCE_PULL);

    if (!shouldForcePull) {
      print('Operation aborted by user'.yellow);
      return;
    }
    executeAndPipe(`git reset --hard ${remote}/${currentBranchName}`);
    return;
  }

  if (shouldPull) {
    executeAndPipe(`git rebase ${remote}/${currentBranchName}`);
  }
};

module.exports = {
  QUESTIONS,

  command,
  aliases,
  describe,
  description: describe,
  builder: fetchArgs,
  handler: fetchHandler,
};
