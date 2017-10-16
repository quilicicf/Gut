const _ = require('lodash');

const execution = require('./utils/execution');
const prompt = require('./utils/prompt');

module.exports = (() => {
  const REMOTES = {
    LOCAL: {
      name: 'local'.green,
      argumentMatcher: (argument) => {
        return !argument || argument === 'l' || argument === 'local';
      },
      deleteCommands: {
        branch: (branchToDelete) => execution.executeAndPipe('git', [ 'branch', '-D', branchToDelete ]),
        tag: (tagToDelete) => execution.executeAndPipe('git', [ 'tag', '-d', tagToDelete ])
      }
    },
    ORIGIN: {
      name: 'origin'.blue,
      argumentMatcher: (argument) => {
        return argument === 'o' || argument === 'origin';
      },
      deleteCommands: {
        branch: (branchToDelete) => execution.executeAndPipe('git', [ 'push', 'origin', '--delete', branchToDelete ]),
        tag: (tagToDelete) => execution.executeAndPipe('git', [ 'push', 'origin', '--delete', tagToDelete ])
      }
    },
    UPSTREAM: {
      name: 'upstream'.red,
      argumentMatcher: (argument) => {
        return !argument || argument === 'u' || argument === 'upstream';
      },
      deleteCommands: {
        branch: (branchToDelete) => execution.executeAndPipe('git', [ 'push', 'upstream', '--delete', branchToDelete ]),
        tag: (tagToDelete) => execution.executeAndPipe('git', [ 'push', 'upstream', '--delete', tagToDelete ])
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
      type: 'string',
      conflicts: 'tag'
    },
    TAG: {
      name: 'tag',
      alias: 't',
      describe: 'The tag to delete',
      type: 'string',
      conflicts: 'branch'
    }
  };

  const deleteItem = (itemName, itemToDelete, targetRemoteArgument) => {
    const targetRemote = _(REMOTES)
      .filter(remote => {
        return remote.argumentMatcher(targetRemoteArgument);
      })
      .first();

    if (!targetRemote) {
      execution.exit(`No remote found for argument: '${targetRemoteArgument}'`, 1);
    }

    prompt.yesNoPrompt(
      `Delete ${itemName} ${itemToDelete.bold} on ${targetRemote.name}?`,
      (value) => {
        if (value) {
          targetRemote.deleteCommands[ itemName ](itemToDelete);
        } else {
          execution.print('Operation aborted.'.yellow);
        }
      }
    );
  };

  return {
    obliterate: (yargs) => {
      const args = yargs
        .usage('usage: $0 delete [options]')
        .option(ARGUMENTS.REMOTE.name, ARGUMENTS.REMOTE)
        .option(ARGUMENTS.BRANCH.name, ARGUMENTS.BRANCH)
        .option(ARGUMENTS.TAG.name, ARGUMENTS.TAG)
        .check((currentArguments) => {
          if (!currentArguments[ ARGUMENTS.BRANCH.name ] && !currentArguments[ ARGUMENTS.TAG.name ]) {
            throw Error('You must specify the branch/tag you want to delete'.red);
          }

          if (currentArguments[ ARGUMENTS.BRANCH.name ] && currentArguments[ ARGUMENTS.TAG.name ]) {
            throw Error(`Arguments ${ARGUMENTS.BRANCH.name} and ${ARGUMENTS.TAG.name} are mutually exclusive.`.red);
          }

          return true;
        })
        .help()
        .argv;

      const branchName = args[ ARGUMENTS.BRANCH.name ];
      const tagName = args[ ARGUMENTS.TAG.name ];
      const remote = args[ ARGUMENTS.REMOTE.name ];

      if (branchName) {
        deleteItem(ARGUMENTS.BRANCH.name, branchName, remote);
      } else if (tagName) {
        deleteItem(ARGUMENTS.TAG.name, tagName, remote);
      }
    }
  };
})();
