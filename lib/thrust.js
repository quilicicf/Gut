module.exports = (() => {
  const _ = require('lodash');

  const utils = require('./utils');

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
      const remotes = utils.getRemotes();
      const remotesAsString = `[ ${_.join(remotes, ', ')} ]`;
      const arguments = yargs
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

      const currentBranch = utils.getCurrentBranch();
      const targetRemote = arguments[ ARGUMENTS.REMOTE.name ];

      if (targetRemote) {
        utils.execute(`git push --set-upstream '${targetRemote}' '${currentBranch}'`);
        return;
      }

      const currentBranchRemote = utils.getBranchInfo(utils.getCurrentBranch(), 'remote'); // TODO: argument remote should be variabelized
      if (currentBranchRemote) {
        utils.execute(`git push`);

      } else if (_.size(remotes) === 1) {
        utils.execute(`git push --set-upstream '${remotes[ 0 ]}' '${currentBranch}'`);

      } else {
        throw Error(`Too many remotes available, can't push if the target remote is not specified.\nCurrent remotes: ${remotesAsString}`);
      }
    }
  };
})
();
