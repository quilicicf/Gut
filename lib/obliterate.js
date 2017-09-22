module.exports = (() => {
  const _ = require('lodash');
  const utils = require('./utils');

  const REMOTES = {
    LOCAL: {
      name: 'local',
      argumentMatcher: (argument) => {
        return !argument || argument === 'l' || argument === 'local';
      },
      deleteBranchCommand: (branchToDelete) => utils.executeAndPipe('git', [ 'branch', '-D', branchToDelete ])
    },
    ORIGIN: {
      name: 'origin',
      argumentMatcher: (argument) => {
        return argument === 'o' || argument === 'origin';
      },
      deleteBranchCommand: (branchToDelete) => utils.executeAndPipe('git', [ 'push', 'origin', '--delete', branchToDelete ])
    },
    UPSTREAM: {
      name: 'upstream',
      argumentMatcher: (argument) => {
        return !argument || argument === 'u' || argument === 'upstream';
      },
      deleteBranchCommand: (branchToDelete) => utils.executeAndPipe('git', [ 'push', 'upstream', '--delete', branchToDelete ])
    }
  };

  const ARGUMENTS = {
    REMOTE: {
      name: 'remote',
      alias: 'r',
      describe: 'The remote where the delete should be deleted. Leave empty to delete the item locally.',
      type: 'string'
    },
    BRANCH: {
      name: 'branch',
      alias: 'b',
      describe: 'The branch to be deleted',
      type: 'string'
    }
  };

  const deleteBranch = (branchToDelete, targetRemoteArgument) => {
    const targetRemote = _(REMOTES)
      .filter(remote => {
        return remote.argumentMatcher(targetRemoteArgument);
      })
      .first();

    if (!targetRemote) {
      utils.exit(`No remote found for argument: '${targetRemoteArgument}'`, 1);
    }

    targetRemote.deleteBranchCommand(branchToDelete);
  };

  return {
    obliterate: (yargs) => {
      const arguments = yargs
        .usage('usage: $0 delete [options]')
        .option(ARGUMENTS.REMOTE.name, ARGUMENTS.REMOTE)
        .option(ARGUMENTS.BRANCH.name, ARGUMENTS.BRANCH)
        .check((arguments) => {
          if (!arguments[ ARGUMENTS.BRANCH.name ]) {
            throw Error('You must specify the branch you want to delete'.red);
          }

          return true;
        })
        .help()
        .argv;

      if (arguments[ ARGUMENTS.BRANCH.name ]) {
        deleteBranch(arguments[ ARGUMENTS.BRANCH.name ], arguments[ ARGUMENTS.REMOTE.name ]);
      }
    }
  };
})();
