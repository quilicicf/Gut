const _ = require('lodash');

const path = require('path');

const execution = require('../../utils/execution');
const git = require('../../utils/git');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Undoes commits';

const QUESTIONS = {
  CONFIRM_HARD_UNDO: 'lib/git/undo:confirm_hard_undo'
};

const ARG_COMMITS_NUMBER = {
  name: 'commits-number',
  alias: 'n',
  describe: 'The number of commits to undo',
  type: 'integer',
  default: 1
};

const ARG_STASH = {
  name: 'stash-changes',
  alias: 's',
  describe: 'Stashes the changes',
  type: 'boolean'
};

const ARG_DESCRIPTION = {
  name: 'description',
  alias: 'd',
  describe: `Changes description, used to name the stash entry if '--${ARG_STASH.name}' is used`,
  type: 'string'
};

const ARG_HARD = {
  name: 'hard',
  alias: 'h',
  describe: 'Deletes the changes permanently, a confirmation is prompted to prevent data loss',
  type: 'boolean'
};

const undoArgs = (yargs) => {
  return yargs
    .usage(`usage: gut ${command} [options]`)
    .option(ARG_COMMITS_NUMBER.name, ARG_COMMITS_NUMBER)
    .option(ARG_STASH.name, ARG_STASH)
    .option(ARG_DESCRIPTION.name, ARG_DESCRIPTION)
    .option(ARG_HARD.name, ARG_HARD)
    .check((currentArguments) => {
      if (currentArguments[ ARG_DESCRIPTION.name ] && !currentArguments[ ARG_STASH.name ]) {
        throw Error(`The parameter ${ARG_DESCRIPTION.name} is only available when ${ARG_STASH.name} is set.`.red);
      }

      if (currentArguments[ ARG_HARD.name ] && currentArguments[ ARG_STASH.name ]) {
        throw Error(`The parameters ${ARG_HARD.name} and ${ARG_STASH.name} are mutually exclusive.`.red);
      }

      return true;
    })
    .help();
};

const undoHandler = async (args) => {
  if (git.isDirty()) {
    throw new Error('Can only undo commits when the repository is clean!'.red);
  }

  const commitsNumber = args[ ARG_COMMITS_NUMBER.name ];
  const resetCommand = `git reset "HEAD~${commitsNumber}"`;
  const addAllCommand = 'git add $(git rev-parse --show-toplevel) -A';

  if (args[ ARG_STASH.name ]) {
    const description = args[ ARG_DESCRIPTION.name ];
    const stashCommand = _.isEmpty(description)
      ? 'git stash'
      : `git stash save "${_.replace(description, /\\"/gm, '\\"')}"`;
    execution.executeAndPipe(`${resetCommand}; ${addAllCommand}; ${stashCommand}`);

  } else if (args[ ARG_HARD.name ]) {
    const commits = execution.execute(`git --no-pager log -n ${commitsNumber} --pretty=format:'%Cred%h%Creset - %s %Cgreen(%cr) %C(bold blue)<%an>%Creset %C(yellow)%d%Creset'`);

    const question = {
      type: QUESTION_TYPES.BOOLEAN,
      id: QUESTIONS.CONFIRM_HARD_UNDO,
      message: `Are you sure you want to undo these commits ?\n\n${commits}\n\nThey will be lost forever`,
      default: false
    };

    const shouldUndo = await ask(question);
    if (shouldUndo) {
      const eraseCommand = 'git reset --hard';
      execution.executeAndPipe(`${resetCommand}; ${addAllCommand}; ${eraseCommand}`);
    }

  } else {
    execution.executeAndPipe(resetCommand);

  }
};

module.exports = {
  ARG_COMMITS_NUMBER,
  ARG_DESCRIPTION,
  ARG_HARD,
  ARG_STASH,

  QUESTIONS,

  command,
  aliases,
  describe,
  builder: undoArgs,
  handler: undoHandler
};