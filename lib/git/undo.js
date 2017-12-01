const _ = require('lodash');

const execution = require('../utils/execution');
const git = require('../utils/git');
const prompt = require('../utils/prompt');

module.exports = (() => {
  const ARGUMENTS = {
    COMMITS_NUMBER: {
      name: 'commits-number',
      alias: 'n',
      describe: 'The number of commits to undo',
      type: 'integer',
      default: 1
    },
    STASH: {
      name: 'stash-changes',
      alias: 's',
      describe: 'Stashes the changes',
      type: 'boolean'
    },
    DESCRIPTION: {
      name: 'description',
      alias: 'd',
      // TODO: the name should always be retrieved via STASH.name
      describe: 'Changes description, used to name the stash entry if `--stash-changes` is used',
      type: 'string'
    },
    HARD: {
      name: 'hard',
      alias: 'h',
      describe: 'Deletes the changes permanently, a confirmation is prompted to prevent data loss',
      type: 'boolean'
    }
  };

  return {
    undo: yargs => {
      const args = yargs
        .usage('usage: $0 undo [options]')
        .option(ARGUMENTS.COMMITS_NUMBER.name, ARGUMENTS.COMMITS_NUMBER)
        .option(ARGUMENTS.STASH.name, ARGUMENTS.STASH)
        .option(ARGUMENTS.DESCRIPTION.name, ARGUMENTS.DESCRIPTION)
        .option(ARGUMENTS.HARD.name, ARGUMENTS.HARD)
        .check((currentArguments) => {
          if (currentArguments[ ARGUMENTS.DESCRIPTION.name ] && !currentArguments[ ARGUMENTS.STASH.name ]) {
            throw Error(`The parameter ${ARGUMENTS.DESCRIPTION.name} is only available when ${ARGUMENTS.STASH.name} is set.`.red);
          }

          return true;
        })
        .help()
        .argv;

      if (git.isDirty()) {
        throw new Error('Can only undo commits when the repository is clean!'.red);
      }

      const commitsNumber = args[ ARGUMENTS.COMMITS_NUMBER.name ];
      const resetCommand = `git reset "HEAD~${commitsNumber}"`;
      const addAllCommand = 'git add $(git rev-parse --show-toplevel) -A';

      if (args[ ARGUMENTS.STASH.name ]) {
        const description = args[ ARGUMENTS.DESCRIPTION.name ];
        const stashCommand = _.isEmpty(description)
          ? 'git stash'
          : `git stash save "${_.replace(description, /\\"/gm, '\\"')}"`;
        execution.executeAndPipe(`${resetCommand}; ${addAllCommand}; ${stashCommand}`);

      } else if (args[ ARGUMENTS.HARD.name ]) {
        const commits = execution.execute(`git --no-pager log -n ${commitsNumber} --pretty=format:'%Cred%h%Creset - %s %Cgreen(%cr) %C(bold blue)<%an>%Creset %C(yellow)%d%Creset'`);
        prompt.yesNoPromisifiedPrompt(`Are you sure you want to undo these commits ?\n\n${commits}\n\nThey will be lost forever`)
          .then((choice) => {
            if (choice) {
              const eraseCommand = 'git reset --hard';
              execution.executeAndPipe(`${resetCommand}; ${addAllCommand}; ${eraseCommand}`);
            }
          });

      } else {
        execution.executeAndPipe(resetCommand);

      }
    }
  };
})();
