module.exports = (() => {
  const _ = require('lodash');
  const utils = require('./utils');
  const promptly = require('promptly');

  const REMOTES = {
    LOCAL: {
      name: 'local'.green,
      argumentMatcher: (argument) => {
        return !argument || argument === 'l' || argument === 'local';
      },
      deleteBranchCommand: (branchToDelete) => utils.executeAndPipe('git', [ 'branch', '-D', branchToDelete ])
    },
    ORIGIN: {
      name: 'origin'.blue,
      argumentMatcher: (argument) => {
        return argument === 'o' || argument === 'origin';
      },
      deleteBranchCommand: (branchToDelete) => utils.executeAndPipe('git', [ 'push', 'origin', '--delete', branchToDelete ])
    },
    UPSTREAM: {
      name: 'upstream'.red,
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

    promptly.prompt(
      `Delete branch ${branchToDelete.bold} on ${targetRemote.name}? (y/n)`,
      {
        default: 'n',
        validator: choice => choice === 'y'
      },
      (error, value) => {
        if (error) {
          throw error;
        }

        if (value) {
          targetRemote.deleteBranchCommand(branchToDelete);
        } else {
          console.log('Operation aborted.'.yellow);
        }
      });
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
