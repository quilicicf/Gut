import log from '../../dependencies/log.ts';

import { executeAndGetStdout } from '../../lib/exec/executeAndGetStdout.ts';

const REMOTES_SHORTCUTS: { [ id: string ]: string } = {
  o: 'origin',
  u: 'upstream',
};

const printDivisions = async (remote: string | undefined): Promise<string> => {
  const baseCommand = [ 'git', 'branch', '--color' ];
  return executeAndGetStdout(
    remote
      ? [ ...baseCommand, '--remotes', '--list', `${REMOTES_SHORTCUTS[ remote ] || remote}/*` ]
      : baseCommand,
  );
};

export const command = 'divisions';
export const aliases = [ 'd' ];
export const describe = 'Displays the given remote\'s branches';

export function builder (yargs: any) {
  return yargs.usage('usage: gut divisions [options]')
    .option('remote', {
      alias: 'r',
      default: null,
      describe: 'The remote whose branches should be displayed',
      type: 'string',
    });
}

export async function handler ({ remote, isTestRun }: { remote?: string, isTestRun: boolean }) {
  const divisions = await printDivisions(remote);

  if (isTestRun) { return divisions; }
  await log(Deno.stdout, divisions);
  return divisions;
}

export const test = { printDivisions };
