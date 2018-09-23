const _ = require('lodash');

const path = require('path');

const branches = require('../../utils/branches');
const execution = require('../../utils/execution');
const git = require('../../utils/git');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Pushes local changes to a remote';

const ARG_REMOTE = {
  name: 'remote',
  alias: 'r',
  describe: 'The remote to push to. Not needed if the branch was already pushed',
  type: 'string',
};

const ARG_FORCE = {
  name: 'force',
  alias: 'f',
  describe: 'Force the push. This erases concurrent server-modifications. A fetch is done to make sure you are alone working on that branch',
  type: 'string',
};

const thrustArgs = (yargs) => {
  const remotes = git.getRemotes();
  const remotesAsString = `[ ${_.join(remotes, ', ')} ]`;
  return yargs
    .usage(`usage: gut ${command} [options]`)
    .option(ARG_REMOTE.name, ARG_REMOTE)
    .option(ARG_FORCE.name, ARG_FORCE)
    .coerce(ARG_REMOTE.name, (argument) => {
      if (!_.includes(remotes, argument)) {
        throw Error(`The remote you specified is unknown. You can add remotes with 'git remote add'.\nCurrent remotes: ${remotesAsString}`.red);
      }

      return argument;
    })
    .help();
};

const thrustHandler = (args) => {
  const remotes = git.getRemotes();
  const remotesAsString = `[ ${_.join(remotes, ', ')} ]`;

  const currentBranch = branches.getCurrentBranchName();
  const { [ ARG_REMOTE.name ]: targetRemote } = args;

  if (targetRemote) {
    execution.execute(`git push --set-upstream '${targetRemote}' '${currentBranch}'`);
    return;
  }

  const currentBranchRemote = branches.getBranchInfo(branches.BRANCH_INFO_PARTS.REMOTE);
  if (currentBranchRemote) {
    execution.execute('git push');
  } else if (_.size(remotes) === 1) {
    execution.execute(`git push --set-upstream '${remotes[ 0 ]}' '${currentBranch}'`);
  } else {
    throw Error(`Too many remotes available, can't push if the target remote is not specified.\nCurrent remotes: ${remotesAsString}`);
  }
};

module.exports = {
  ARG_REMOTE,

  command,
  aliases,
  describe,
  builder: thrustArgs,
  handler: thrustHandler,
};
