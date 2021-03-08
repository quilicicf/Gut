import { exec, OutputMode } from '../../dependencies/exec.ts';
import { getParentBranch, stringifyBranch } from '../../lib/branch.ts';
import { getAllRefs, getCurrentBranch } from '../../lib/git.ts';
import { promptSelect } from '../../dependencies/cliffy.ts';

interface Args {
  master?: boolean,
  parent?: boolean,
  last?: boolean,
  branchesOnly?: boolean,
  tagsOnly?: boolean,
  search?: string,

  // Test thingies
  isTestRun: boolean,
}

const simpleCommand = 'switch';
export const command = `${simpleCommand} [search]`;
export const aliases = [ 's' ];
export const describe = 'Checks out a branch';

const switchToBranch = async (branch: string, isTestRun: boolean) => {
  const { output } = await exec(`git checkout ${branch}`, { output: isTestRun ? OutputMode.Capture : OutputMode.Tee });
  return output;
};

const selectRefAndSwitch = async (options: string[], isTestRun: boolean) => {
  if (options.length === 0) { throw Error('No ref matches your search!'); }
  if (options.length === 1) { return switchToBranch(options[ 0 ], isTestRun); }

  const ref = await promptSelect({
    message: 'Choose the ref to switch to',
    options,
    search: true,
  });

  return switchToBranch(ref, isTestRun);
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
    master, parent, last,
    branchesOnly, tagsOnly,
    search,
    isTestRun,
  } = args;

  if (master) { return switchToBranch('master', isTestRun); }
  if (last) { return switchToBranch('-', isTestRun); }

  if (parent) {
    const currentBranch = await getCurrentBranch();
    const parentBranch = getParentBranch(currentBranch);
    const parentBranchAsString = stringifyBranch(parentBranch);
    return switchToBranch(parentBranchAsString, isTestRun);
  }

  const { branches, tags } = await getAllRefs(search);
  if (branchesOnly) {
    return selectRefAndSwitch(branches, isTestRun);
  }
  if (tagsOnly) {
    return selectRefAndSwitch(tags, isTestRun);
  }

  return selectRefAndSwitch([ ...branches, ...tags ], isTestRun);
}

export const test = {};
