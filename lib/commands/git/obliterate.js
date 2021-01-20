const _ = require('lodash');

const path = require('path');

const execution = require('../../utils/execution');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Deletes a branch or a tag';

const REMOTES = {
  LOCAL: {
    name: 'local'.green,
    argumentMatcher: (argument) => !argument || argument === 'l' || argument === 'local',
    deleteCommands: {
      branch: (branchToDelete) => execution.executeAndPipe(`git branch -D ${branchToDelete}`),
      tag: (tagToDelete) => execution.executeAndPipe(`git tag -d ${tagToDelete}`),
    },
  },
  ORIGIN: {
    name: 'origin'.blue,
    argumentMatcher: (argument) => argument === 'o' || argument === 'origin',
    deleteCommands: {
      branch: (branchToDelete) => execution.executeAndPipe(`git push origin --delete ${branchToDelete}`),
      tag: (tagToDelete) => execution.executeAndPipe(`git push origin --delete ${tagToDelete}`),
    },
  },
  UPSTREAM: {
    name: 'upstream'.red,
    argumentMatcher: (argument) => !argument || argument === 'u' || argument === 'upstream',
    deleteCommands: {
      branch: (branchToDelete) => execution.executeAndPipe(`git push upstream --delete ${branchToDelete}`),
      tag: (tagToDelete) => execution.executeAndPipe(`git push upstream --delete ${tagToDelete}`),
    },
  },
};

const QUESTIONS = {
  CONFIRM_OBLITERATION: 'lib/git/obliterate:confirm_obliteration',
};

const ARG_REMOTE = {
  name: 'remote',
  alias: 'r',
  describe: 'The remote where the item should be deleted. Leave empty to delete the item locally.',
  type: 'string',
};

const ARG_BRANCH = {
  name: 'branch',
  alias: 'b',
  describe: 'The branch to delete',
  type: 'string',
  conflicts: 'tag',
};

const ARG_TAG = {
  name: 'tag',
  alias: 't',
  describe: 'The tag to delete',
  type: 'string',
  conflicts: 'branch',
};

const ARG_ASSUME_YES = {
  name: 'assume-yes',
  alias: 'y',
  describe: 'Does not show confirmation before deleting. To be used with caution.',
  type: 'boolean',
  default: false,
};

const deleteItem = async (itemName, itemToDelete, targetRemoteArgument, assumeYes) => {
  const targetRemote = _.find(REMOTES, (remote) => remote.argumentMatcher(targetRemoteArgument));

  if (!targetRemote) {
    execution.exit(1, `No remote found for argument: '${targetRemoteArgument}'`);
  }

  const question = {
    type: QUESTION_TYPES.BOOLEAN,
    id: QUESTIONS.CONFIRM_OBLITERATION,
    message: `Delete ${itemName} ${itemToDelete.bold} on ${targetRemote.name}?`,
    default: false,
  };

  const shouldProceed = assumeYes || await ask(question);
  if (shouldProceed) {
    targetRemote.deleteCommands[ itemName ](itemToDelete);
  } else {
    execution.print('Operation aborted.'.yellow);
  }
};

const obliterateArgs = (yargs) => yargs
  .usage(`usage: gut ${path.parse(__filename).name} [options]`)
  .option(ARG_REMOTE.name, ARG_REMOTE)
  .option(ARG_BRANCH.name, ARG_BRANCH)
  .option(ARG_TAG.name, ARG_TAG)
  .option(ARG_ASSUME_YES.name, ARG_ASSUME_YES)
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

const obliterateHandler = async (args) => {
  const branchName = args[ ARG_BRANCH.name ];
  const tagName = args[ ARG_TAG.name ];
  const remote = args[ ARG_REMOTE.name ];
  const assumeYes = args[ ARG_ASSUME_YES.name ];

  if (branchName) {
    await deleteItem(ARG_BRANCH.name, branchName, remote, assumeYes);
  } else if (tagName) {
    await deleteItem(ARG_TAG.name, tagName, remote, assumeYes);
  }
};

module.exports = {
  ARG_BRANCH,
  ARG_REMOTE,
  ARG_TAG,
  ARG_ASSUME_YES,

  QUESTIONS,

  command,
  aliases,
  describe,
  builder: obliterateArgs,
  handler: obliterateHandler,
};
