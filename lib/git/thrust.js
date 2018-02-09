const _ = require('lodash');

const path = require('path');

const branches = require('../utils/branches');
const execution = require('../utils/execution');
const git = require('../utils/git');

const REMOTES_LOCATION = 'additional.remotes';
const REMOTES_AS_STRING_LOCATION = 'additional.remotesAsString';

const ARG_REMOTE = {
  name: 'remote',
  alias: 'r',
  describe: 'The remote to push to. Not needed if the branch was already pushed',
  type: 'string'
};


module.exports = {
  thrustArgs: (yargs) => {
    const remotes = git.getRemotes();
    const remotesAsString = `[ ${_.join(remotes, ', ')} ]`;
    const args = yargs
      .usage(`usage: $0 ${path.parse(__filename).name} [options]`)
      .option(ARG_REMOTE.name, ARG_REMOTE)
      .coerce(ARG_REMOTE.name, argument => {
        if (!_.includes(remotes, argument)) {
          throw Error(`The remote you specified is unknown. You can add remotes with 'git remote add'.\nCurrent remotes: ${remotesAsString}`.red);
        }

        return argument;
      })
      .help();

    _.set(args, REMOTES_LOCATION, remotes);
    _.set(args, REMOTES_AS_STRING_LOCATION, remotesAsString);

    return args;

  },

  thrustCommand: (args) => {
    const remotes = _.get(args, REMOTES_LOCATION);
    const remotesAsString = _.get(args, REMOTES_AS_STRING_LOCATION);

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
  }
};
