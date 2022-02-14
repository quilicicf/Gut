import { promptString } from '../../dependencies/cliffy.ts';
import {
  bindOptionsAndCreateUsage, toYargsUsage, toYargsCommand, ExtraPermissions, YargsOptions, YargsInstance,
} from '../../dependencies/yargs.ts';

import { Branch, BranchFragment } from '../../lib/branch/Branch.ts';
import { getCurrentBranch } from '../../lib/git/getCurrentBranch.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';
import { stringifyBranch } from '../../lib/branch/stringifyBranch.ts';

interface Args {
  issueNumber?: string,
  poc?: boolean,

  // Test thingies
  isTestRun: boolean,
  testDescription: string,
}

function capFirst (input: string): string {
  return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

function camelCase (input: string): string {
  const [ firstFragment, ...rest ] = input.split(' ').filter(Boolean);
  return firstFragment.toLowerCase()
    + rest
      .map((fragment) => capFirst(fragment))
      .join('');
}

export const baseCommand = 'burgeon';
export const aliases = [ 'b' ];
export const describe = 'Creates a branch';
export const options: YargsOptions = {
  'issue-number': {
    alias: 'n',
    describe: 'Specifies the issue number when creating a new branch',
    type: 'string',
    requiresArg: true,
  },
  poc: {
    alias: 'p',
    describe: 'Specifies that the branch contains a PoC',
    type: 'boolean',
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler (args: Args) {
  const {
    issueNumber,
    poc,

    isTestRun,
    testDescription,
  } = args;

  const description = isTestRun ? testDescription : await promptString({ message: 'Describe your dev', minLength: 1 });
  const camelCasedDescription = camelCase(description);
  const currentBranch: Branch = await getCurrentBranch();
  const newFragment: BranchFragment = {
    isPoc: poc,
    issueId: issueNumber,
    description: camelCasedDescription,
  };

  const newBranch: Branch = {
    fragments: currentBranch.fragments.concat([ newFragment ]),
  };

  const newBranchName = stringifyBranch(newBranch);
  await executeProcessCriticalTask([ 'git', 'checkout', '-b', newBranchName ]);
  return newBranchName;
}

export const test = {
  capFirst,
  camelCase,
};
