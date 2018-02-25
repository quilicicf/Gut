const _ = require('lodash');

const path = require('path');

const execution = require('../utils/execution');
const { QUESTION_TYPES, ask } = require('../utils/prompt');

const REMOTES = {
  LOCAL: {
    name: 'local'.green,
    argumentMatcher: (argument) => {
      return !argument || argument === 'l' || argument === 'local';
    },
    deleteCommands: {
      branch: (branchToDelete) => execution.executeAndPipe(`git branch -D ${branchToDelete}`),
      tag: (tagToDelete) => execution.executeAndPipe(`git tag -d ${tagToDelete}`)
    }
  },
  ORIGIN: {
    name: 'origin'.blue,
    argumentMatcher: (argument) => {
      return argument === 'o' || argument === 'origin';
    },
    deleteCommands: {
      branch: (branchToDelete) => execution.executeAndPipe(`git push origin --delete ${branchToDelete}`),
      tag: (tagToDelete) => execution.executeAndPipe(`git push origin --delete ${tagToDelete}`)
    }
  },
  UPSTREAM: {
    name: 'upstream'.red,
    argumentMatcher: (argument) => {
      return !argument || argument === 'u' || argument === 'upstream';
    },
    deleteCommands: {
      branch: (branchToDelete) => execution.executeAndPipe(`git push upstream --delete ${branchToDelete}`),
      tag: (tagToDelete) => execution.executeAndPipe(`git push upstream --delete ${tagToDelete}`)
    }
  }
};

const QUESTIONS = {
  CONFIRM_OBLITERATION: 'lib/git/obliterate:confirm_obliteration'
};

const ARG_REMOTE = {
  name: 'remote',
  alias: 'r',
  describe: 'The remote where the item should be deleted. Leave empty to delete the item locally.',
  type: 'string'
};

const ARG_BRANCH = {
  name: 'branch',
  alias: 'b',
  describe: 'The branch to delete',
  type: 'string',
  conflicts: 'tag'
};

const ARG_TAG = {
  name: 'tag',
  alias: 't',
  describe: 'The tag to delete',
  type: 'string',
  conflicts: 'branch'
};

const deleteItem = async (itemName, itemToDelete, targetRemoteArgument) => {
  const targetRemote = _.find(REMOTES, (remote) => {
    return remote.argumentMatcher(targetRemoteArgument);
  });

  if (!targetRemote) {
    execution.exit(1, `No remote found for argument: '${targetRemoteArgument}'`);
  }

  const question = {
    type: QUESTION_TYPES.BOOLEAN,
    id: QUESTIONS.CONFIRM_OBLITERATION,
    message: `Delete ${itemName} ${itemToDelete.bold} on ${targetRemote.name}?`,
    default: false
  };

  const shouldAbort = await ask(question);
  if (shouldAbort) {
    targetRemote.deleteCommands[ itemName ](itemToDelete);
  } else {
    execution.print('Operation aborted.'.yellow);
  }
};

const obliterateArgs = (yargs) => {
  return yargs
    .usage(`usage: $0 ${path.parse(__filename).name} [options]`)
    .option(ARG_REMOTE.name, ARG_REMOTE)
    .option(ARG_BRANCH.name, ARG_BRANCH)
    .option(ARG_TAG.name, ARG_TAG)
    .check((currentArguments) => {
      if (!currentArguments[ ARG_BRANCH.name ] && !currentArguments[ ARG_TAG.name ]) {
        throw Error('You must specify the branch/tag you want to delete'.red);
      }

      if (currentArguments[ ARG_BRANCH.name ] && currentArguments[ ARG_TAG.name ]) {
        throw Error(`Arguments ${ARG_BRANCH.name} and ${ARG_TAG.name} are mutually exclusive.`.red);
      }

      return true;
    })
    .help();
};

const obliterateCommand = async (args) => {
  const branchName = args[ ARG_BRANCH.name ];
  const tagName = args[ ARG_TAG.name ];
  const remote = args[ ARG_REMOTE.name ];

  if (branchName) {
    await deleteItem(ARG_BRANCH.name, branchName, remote);
  } else if (tagName) {
    await deleteItem(ARG_TAG.name, tagName, remote);
  }
};

module.exports = { QUESTIONS, obliterateArgs, obliterateCommand };
