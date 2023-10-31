import { promptSelect } from '../../dependencies/cliffy.ts';
import { stoyleGlobal, theme } from '../../dependencies/stoyle.ts';
import {
  bindOptionsAndCreateUsage,
  ExtraPermissions,
  toYargsCommand,
  toYargsUsage,
  YargsInstance,
  YargsOptions,
} from '../../dependencies/yargs.ts';

import { getAllRefs } from '../../lib/git/getAllRefs.ts';
import { getCurrentBranch } from '../../lib/git/getCurrentBranch.ts';
import { getParentBranch } from '../../lib/branch/getParentBranch.ts';
import { stringifyBranch } from '../../lib/branch/stringifyBranch.ts';
import { executeAndGetStdout } from '../../lib/exec/executeAndGetStdout.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';
import { DEFAULT_REMOTE } from '../../lib/git/remotes.ts';

interface Args {
  master?: boolean,
  parent?: boolean,
  defaultBranch?: string,
  last?: boolean,
  branchesOnly?: boolean,
  tagsOnly?: boolean,
  search?: string,
}

export const baseCommand = 'switch';
export const aliases = [ 's' ];
export const describe = 'Checks out a branch';
export const options: YargsOptions = {
  master: {
    alias: 'm',
    describe: 'Switch to master',
    type: 'boolean',
  },
  parent: {
    alias: 'p',
    describe: 'Switch to parent branch',
    type: 'boolean',
  },
  'default-branch': {
    alias: 'd',
    describe: 'Switch to the default branch on the provided remote. Defaults to origin',
    type: 'string',
    coerce (input: string) {
      const remoteRegex = /^[^a-z0-9A-Z_]+$/;
      if (Boolean(input) && !remoteRegex.test(input)) {
        throw Error(stoyleGlobal`Remote names must match ${remoteRegex}`(theme.error));
      }
      return input;
    },
  },
  last: {
    alias: 'l',
    describe: 'Switch to last branch',
    type: 'boolean',
  },
  'tags-only': {
    alias: 't',
    describe: 'Only choose from tags',
    type: 'boolean',
  },
  'branches-only': {
    alias: 'b',
    describe: 'Only choose from branches',
    type: 'boolean',
  },
  search: {
    describe: 'Search text to filter the candidates',
    type: 'string',
    isPositionalOption: true,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

const switchToBranch = async (branch: string) => {
  await executeProcessCriticalTask('git', [ 'checkout', branch ]);
};

const selectRefAndSwitch = async (candidateRefs: string[]) => {
  if (candidateRefs.length === 0) { throw Error('No ref matches your search!'); }
  if (candidateRefs.length === 1) { return switchToBranch(candidateRefs[ 0 ]); }

  const ref = await promptSelect({
    message: 'Choose the ref to switch to',
    options: candidateRefs,
    search: true,
  });

  return switchToBranch(ref);
};

export async function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler (args: Args) {
  const {
    master, parent, defaultBranch, last,
    branchesOnly, tagsOnly,
    search,
  } = args;

  if (master) { return switchToBranch('master'); }
  if (last) { return switchToBranch('-'); }

  if (defaultBranch !== undefined) {
    const remote = defaultBranch || DEFAULT_REMOTE.name;
    const output = await executeAndGetStdout(
      'git',
      [ 'remote', 'set-head', remote, '--auto' ],
      { shouldTruncateTrailingLineBreak: true },
    );
    const defaultBranchName = output.split(' ').pop();

    if (!defaultBranchName) {
      throw Error(`Could not find default branch, git remote set-head returned: ${output}`);
    }

    return switchToBranch(defaultBranchName);
  }

  if (parent) {
    const currentBranch = await getCurrentBranch();
    const parentBranch = getParentBranch(currentBranch);
    const parentBranchAsString = stringifyBranch(parentBranch);
    return switchToBranch(parentBranchAsString);
  }

  const { branches, tags } = await getAllRefs(search);
  if (branchesOnly) { return selectRefAndSwitch(branches); }
  if (tagsOnly) { return selectRefAndSwitch(tags); }

  return selectRefAndSwitch([ ...branches, ...tags ]);
}

export const test = {};
