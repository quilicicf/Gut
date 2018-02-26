const _ = require('lodash');

const path = require('path');

const branches = require('../utils/branches');
const execution = require('../utils/execution');
const git = require('../utils/git');

const NAME = path.parse(__filename).name;
const ALIASES = [ NAME.charAt(0) ];
const IDENTIFIERS = _.concat(NAME, ALIASES);
const DESCRIPTION = 'Pushes local changes to a remote';

const ARG_REMOTE = {
  name: 'remote',
  alias: 'r',
  describe: 'The remote to push to. Not needed if the branch was already pushed',
  type: 'string'
};

const thrustArgs = (yargs) => {
  const remotes = git.getRemotes();
  const remotesAsString = `[ ${_.join(remotes, ', ')} ]`;
  return yargs
    .usage(`usage: $0 ${NAME} [options]`)
    .option(ARG_REMOTE.name, ARG_REMOTE)
    .coerce(ARG_REMOTE.name, argument => {
      if (!_.includes(remotes, argument)) {
        throw Error(`The remote you specified is unknown. You can add remotes with 'git remote add'.\nCurrent remotes: ${remotesAsString}`.red);
      }

      return argument;
    })
    .help();
};

const thrustCommand = (args) => {
  const remotes = git.getRemotes();
  const remotesAsString = `[ ${_.join(remotes, ', ')} ]`;

  const currentBranch = branches.getCurrentBranchName();
  const targetRemote = args[ ARG_REMOTE.name ];

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
  NAME,
  ALIASES,
  IDENTIFIERS,
  DESCRIPTION,

  ARG_REMOTE,

  builder: thrustArgs,
  command: thrustCommand
};
