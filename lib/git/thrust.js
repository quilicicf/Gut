const _ = require('lodash');

const branches = require('../utils/branches');
const execution = require('../utils/execution');
const git = require('../utils/git');

module.exports = (() => {
  const ARGUMENTS = {
    REMOTE: {
      name: 'remote',
      alias: 'r',
      describe: 'The remote to push to. Not needed if the branch was already pushed',
      type: 'string'
    }
  };

  return {
    thrust: yargs => {
      const remotes = git.getRemotes();
      const remotesAsString = `[ ${_.join(remotes, ', ')} ]`;
      const args = yargs
        .usage('usage: $0 thrust [options]')
        .option(ARGUMENTS.REMOTE.name, ARGUMENTS.REMOTE)
        .coerce(ARGUMENTS.REMOTE.name, argument => {
          if (!_.includes(remotes, argument)) {
            throw Error(`The remote you specified is unknown. You can add remotes with 'git remote add'.\nCurrent remotes: ${remotesAsString}`.red);
          }

          return argument;
        })
        .help()
        .argv;

      const currentBranch = branches.getCurrentBranch();
      const targetRemote = args[ ARGUMENTS.REMOTE.name ];

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
})();
