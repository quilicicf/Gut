import log from '../../dependencies/log.ts';
import { promptConfirm } from '../../dependencies/cliffy.ts';
import { applyStyle, theme } from '../../dependencies/colors.ts';

import { getTopLevel } from '../../lib/git/getTopLevel.ts';
import { getCommitsUpToMax, isDirty } from '../../lib/git.ts';
import { executeProcessCriticalTasks } from '../../lib/exec/executeProcessCriticalTasks.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';

interface Args {
  commitsNumber: number,
  stashChanges: boolean,
  description?: string,
  hard: boolean,

  // Test thingies
  isTestRun: boolean,
}

export const command = 'undo';
export const aliases = [ 'u' ];
export const describe = 'Undoes commits';

export async function builder (yargs: any) {
  const stashChangesArgument = 'stash-changes';
  const hardArgument = 'hard';
  return yargs.usage(`usage: gut ${command} [options]`)
    .option('commits-number', {
      alias: 'n',
      describe: 'The number of commits to undo',
      type: 'integer',
      default: 1,
    })
    .option(stashChangesArgument, {
      alias: 's',
      describe: 'Stashes the changes',
      type: 'boolean',
      default: false,
    })
    .option('description', {
      alias: 'd',
      describe: `Sets the description used as stash entry if --${stashChangesArgument} is used`,
      type: 'string',
      implies: stashChangesArgument,
    })
    .option(hardArgument, {
      alias: 'h',
      describe: 'Deletes the changes permanently, a confirmation is prompted to prevent data loss',
      type: 'boolean',
      default: false,
    })
    .check((args: Args) => {
      if (args.description && !/^[a-zA-Z0-9_-]$/.test(args.description)) {
        throw Error('The description can only contain alpha-numeric characters and -_');
      }

      if (args.commitsNumber <= 0) {
        throw Error('The number of commits to undo must be positive');
      }

      if (args.hard && args.stashChanges) {
        throw Error(`The parameters --${hardArgument} and --${stashChangesArgument} are mutually exclusive.`);
      }

      return true;
    });
}

export async function handler (args: Args) {
  const {
    commitsNumber, stashChanges, description, hard,
  } = args;

  if (await isDirty()) {
    await log(Deno.stderr, applyStyle('Can only undo commits when the repository is clean!', [ theme.error ]));
    Deno.exit(1);
  }

  const resetCommand = [ 'git', 'reset', `HEAD~${commitsNumber}` ];
  const topLevel = await getTopLevel();
  const addAllCommand = [ 'git', 'add', topLevel, '--all' ];

  if (stashChanges) {
    const stashCommand = description
      ? [ 'git', 'stash', 'save', description ]
      : [ 'git', 'stash' ];
    await executeProcessCriticalTasks([
      resetCommand,
      addAllCommand,
      stashCommand,
    ]);
    return;
  }

  if (hard) {
    const commits = await getCommitsUpToMax(commitsNumber, false);
    const commitSubjects = commits.map(({ subject }) => `* ${subject}`);

    const shouldUndo = await promptConfirm({
      message: `Are you sure you want to undo these commits ?\n\n${commitSubjects}\n\nThey will be lost forever`,
      default: false,
    });

    if (!shouldUndo) {
      await log(Deno.stdout, 'Operation aborted!');
      return;
    }
    await executeProcessCriticalTasks([
      resetCommand,
      addAllCommand,
      [ 'git', 'reset', '--hard' ],
    ]);
    return;
  }

  await executeProcessCriticalTask(resetCommand);
}

export const test = {};
