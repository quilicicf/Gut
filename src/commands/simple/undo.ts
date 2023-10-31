import log from '../../dependencies/log.ts';
import { promptConfirm } from '../../dependencies/cliffy.ts';
import { stoyleGlobal, theme } from '../../dependencies/stoyle.ts';
import {
  bindOptionsAndCreateUsage,
  ExtraPermissions,
  toYargsCommand,
  toYargsUsage,
  YargsInstance,
  YargsOptions,
} from '../../dependencies/yargs.ts';

import { isDirty } from '../../lib/git/isDirty.ts';
import { getTopLevel } from '../../lib/git/getTopLevel.ts';
import { getCommitsUpToMax } from '../../lib/git/getCommitsUpToMax.ts';
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

const ARG_HARD = 'hard';
const ARG_STASH_CHANGES = 'stash-changes';

export const baseCommand = 'undo';
export const aliases = [ 'u' ];
export const describe = 'Undoes commits';
export const options: YargsOptions = {
  'commits-number': {
    alias: 'n',
    describe: 'The number of commits to undo',
    type: 'integer',
    default: 1,
  },
  [ ARG_STASH_CHANGES ]: {
    alias: 's',
    describe: 'Stashes the changes',
    type: 'boolean',
    default: false,
  },
  description: {
    alias: 'd',
    describe: `Sets the description used as stash entry if --${ARG_STASH_CHANGES} is used`,
    type: 'string',
    implies: [ ARG_STASH_CHANGES ],
  },
  [ ARG_HARD ]: {
    alias: 'h',
    describe: 'Deletes the changes permanently, a confirmation is prompted to prevent data loss',
    type: 'boolean',
    default: false,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export async function builder (yargs: YargsInstance): Promise<YargsInstance> {
  return bindOptionsAndCreateUsage(yargs, usage, options)
    .check((args: Args) => {
      if (args.description && !/^[a-zA-Z0-9_-]$/.test(args.description)) {
        throw Error('The description can only contain alpha-numeric characters and -_');
      }

      if (args.commitsNumber <= 0) {
        throw Error('The number of commits to undo must be positive');
      }

      if (args.hard && args.stashChanges) {
        throw Error(`The parameters --${ARG_HARD} and --${ARG_STASH_CHANGES} are mutually exclusive.`);
      }

      return true;
    });
}

export async function handler (args: Args) {
  const {
    commitsNumber, stashChanges, description, hard,
  } = args;

  if (await isDirty()) {
    await log(Deno.stderr, stoyleGlobal`Can only undo commits when the repository is clean!`(theme.error));
    Deno.exit(1);
  }

  const resetArgs = [ 'reset', `HEAD~${commitsNumber}` ];
  const topLevel = await getTopLevel();
  const addAllArgs = [ 'add', topLevel, '--all' ];

  if (stashChanges) {
    const stashArgs = description
      ? [ 'stash', 'save', description ]
      : [ 'stash' ];
    await executeProcessCriticalTasks([
      { command: 'git', args: resetArgs },
      { command: 'git', args: addAllArgs },
      { command: 'git', args: stashArgs },
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
      { command: 'git', args: resetArgs },
      { command: 'git', args: addAllArgs },
      { command: 'git', args: [ 'reset', '--hard' ] },
    ]);
    return;
  }

  await executeProcessCriticalTask('git', resetArgs);
}

export const test = {};
