import { exec, OutputMode } from '../../dependencies/exec.ts';
import { getCurrentBranchName } from '../../lib/git.ts';
import { promptString } from '../../dependencies/cliffy.ts';

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

export const command = 'burgeon';
export const aliases = [ 'b' ];
export const describe = 'Creates a branch';

export function builder (yargs: any) {
  return yargs.usage('usage: gut burgeon [options]')
    .option('ticket-number', {
      alias: 'n',
      describe: 'Specifies the ticket number when creating a new branch',
      type: 'string',
    });
}

export async function handler ({ ticketNumber, isTestRun, testDescription }: Args) {
  const description = isTestRun ? testDescription : await promptString({ message: 'Describe your dev', minLength: 1 });
  const camelCasedDescription = camelCase(description);
  const fragment = [ ticketNumber, camelCasedDescription ]
    .filter(Boolean)
    .join('_');
  const currentBranchName = await getCurrentBranchName();
  const newBranchName = `${currentBranchName}__${fragment}`;
  await exec(`git checkout -b ${newBranchName}`, { output: OutputMode.None });
  return newBranchName;
}

export const test = {
  capFirst,
  camelCase,
};
