import { promptString } from '../../dependencies/cliffy.ts';
import {
  bindOptionsAndCreateUsage, toYargsUsage, toYargsCommand, ExtraPermissions, YargsOptions,
} from '../../dependencies/yargs.ts';

import { getCurrentBranchName } from '../../lib/git/getCurrentBranchName.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';

interface Args {
  ticketNumber?: string,

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
  'ticket-number': {
    alias: 'n',
    describe: 'Specifies the ticket number when creating a new branch',
    type: 'string',
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: any) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler ({ ticketNumber, isTestRun, testDescription }: Args) {
  const description = isTestRun ? testDescription : await promptString({ message: 'Describe your dev', minLength: 1 });
  const camelCasedDescription = camelCase(description);
  const fragment = [ ticketNumber, camelCasedDescription ]
    .filter(Boolean)
    .join('_');
  const currentBranchName = await getCurrentBranchName();
  const newBranchName = `${currentBranchName}__${fragment}`;
  await executeProcessCriticalTask([ 'git', 'checkout', '-b', newBranchName ]);
  return newBranchName;
}

export const test = {
  capFirst,
  camelCase,
};
