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
      deleteCommands: {
        branch: (branchToDelete) => utils.executeAndPipe('git', [ 'branch', '-D', branchToDelete ]),
        tag: (tagToDelete) => utils.executeAndPipe('git', [ 'tag', '-d', tagToDelete ])
      }
    },
    ORIGIN: {
      name: 'origin'.blue,
      argumentMatcher: (argument) => {
        return argument === 'o' || argument === 'origin';
      },
      deleteCommands: {
        branch: (branchToDelete) => utils.executeAndPipe('git', [ 'push', 'origin', '--delete', branchToDelete ]),
        tag: (tagToDelete) => utils.executeAndPipe('git', [ 'push', 'origin', '--delete', tagToDelete ])
      }
    },
    UPSTREAM: {
      name: 'upstream'.red,
      argumentMatcher: (argument) => {
        return !argument || argument === 'u' || argument === 'upstream';
      },
      deleteCommands: {
        branch: (branchToDelete) => utils.executeAndPipe('git', [ 'push', 'upstream', '--delete', branchToDelete ]),
        tag: (tagToDelete) => utils.executeAndPipe('git', [ 'push', 'upstream', '--delete', tagToDelete ])
      }
    }
  };

  const ARGUMENTS = {
    REMOTE: {
      name: 'remote',
      alias: 'r',
      describe: 'The remote where the item should be deleted. Leave empty to delete the item locally.',
      type: 'string'
    },
    BRANCH: {
      name: 'branch',
      alias: 'b',
      describe: 'The branch to delete',
      type: 'string'
      // TODO: make the conflict work
      // conflicts: 'tag'
    },
    TAG: {
      name: 'tag',
      alias: 't',
      describe: 'The tag to delete',
      type: 'string'
    }
  };

  const deleteItem = (itemName, itemToDelete, targetRemoteArgument) => {
    const targetRemote = _(REMOTES)
      .filter(remote => {
        return remote.argumentMatcher(targetRemoteArgument);
      })
      .first();

    if (!targetRemote) {
      utils.exit(`No remote found for argument: '${targetRemoteArgument}'`, 1);
    }

    promptly.prompt(
      `Delete ${itemName} ${itemToDelete.bold} on ${targetRemote.name}? (y/n)`,
      {
        default: 'n',
        validator: choice => choice === 'y'
      },
      (error, value) => {
        if (error) {
          throw error;
        }

        if (value) {
          targetRemote.deleteCommands[ itemName ](itemToDelete);
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
        .option(ARGUMENTS.TAG.name, ARGUMENTS.TAG)
        .check((arguments) => {
          if (!arguments[ ARGUMENTS.BRANCH.name ] && !arguments[ ARGUMENTS.TAG.name ]) {
            throw Error('You must specify the branch/tag you want to delete'.red);
          }

          if (arguments[ ARGUMENTS.BRANCH.name ] && arguments[ ARGUMENTS.TAG.name ]) {
            throw Error(`Arguments ${ARGUMENTS.BRANCH.name} and ${ARGUMENTS.TAG.name} are mutually exclusive.`.red);
          }

          return true;
        })
        .help()
        .argv;

      const branchName = arguments[ ARGUMENTS.BRANCH.name ];
      const tagName = arguments[ ARGUMENTS.TAG.name ];
      const remote = arguments[ ARGUMENTS.REMOTE.name ];

      if (branchName) {
        deleteItem(ARGUMENTS.BRANCH.name, branchName, remote);
      } else if (tagName) {
        deleteItem(ARGUMENTS.TAG.name, tagName, remote);
      }
    }
  };
})();
