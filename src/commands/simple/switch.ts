import { promptSelect } from '../../dependencies/cliffy.ts';
import { applyStyle, theme } from '../../dependencies/colors.ts';

import { getAllRefs } from '../../lib/git/getAllRefs.ts';
import { getCurrentBranch } from '../../lib/git/getCurrentBranch.ts';
import { getParentBranch } from '../../lib/branch/getParentBranch.ts';
import { stringifyBranch } from '../../lib/branch/stringifyBranch.ts';
import { executeAndGetStdout } from '../../lib/exec/executeAndGetStdout.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';

interface Args {
  master?: boolean,
  parent?: boolean,
  defaultBranch?: string,
  last?: boolean,
  branchesOnly?: boolean,
  tagsOnly?: boolean,
  search?: string,
}

const simpleCommand = 'switch';
export const command = `${simpleCommand} [search]`;
export const aliases = [ 's' ];
export const describe = 'Checks out a branch';

const switchToBranch = async (branch: string) => {
  await executeProcessCriticalTask([ 'git', 'checkout', branch ]);
};

const selectRefAndSwitch = async (options: string[]) => {
  if (options.length === 0) { throw Error('No ref matches your search!'); }
  if (options.length === 1) { return switchToBranch(options[ 0 ]); }

  const ref = await promptSelect({
    message: 'Choose the ref to switch to',
    options,
    search: true,
  });

  return switchToBranch(ref);
};

export async function builder (yargs: any) {
  return yargs.usage(`usage: gut ${simpleCommand} [options]`)
    .option('master', {
      alias: 'm',
      describe: 'Switch to master',
      type: 'boolean',
    })
    .option('parent', {
      alias: 'p',
      describe: 'Switch to parent branch',
      type: 'boolean',
    })
    .option('default-branch', {
      alias: 'd',
      describe: 'Switch to the default branch on the provided remote. Defaults to origin',
      type: 'string',
      coerce (input: string) {
        const remoteRegex = /^[^a-z0-9A-Z_]+$/;
        if (input !== '' && !remoteRegex.test(input)) {
          throw Error(applyStyle(`Remote names must match ${remoteRegex}`, [ theme.error ]));
        }
        return input;
      },
    })
    .option('last', {
      alias: 'l',
      describe: 'Switch to last branch',
      type: 'boolean',
    })
    .option('tags-only', {
      alias: 't',
      describe: 'Only choose from tags',
      type: 'boolean',
    })
    .option('branches-only', {
      alias: 'b',
      describe: 'Only choose from branches',
      type: 'boolean',
    })
    .positional('search', {
      describe: 'Search text to filter the candidates',
      type: 'string',
    });
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
    const remote = defaultBranch || 'origin';
    const output = await executeAndGetStdout([ 'git', 'remote', 'set-head', remote, '--auto' ]);
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
