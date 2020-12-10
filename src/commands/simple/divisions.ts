import log from '../../dependencies/log.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';

const REMOTES_SHORTCUTS: { [ id: string ]: string } = {
  o: 'origin',
  u: 'upstream',
};

const printDivisions = async (remote: string | undefined): Promise<string> => {
  if (remote) {
    const filter = `--list "${REMOTES_SHORTCUTS[ remote ] || remote}/*"`;
    const { output } = await exec(`git branch --color --remotes --column=always ${filter}`, { output: OutputMode.Capture });
    return `  ${output}\n`;
  }

  const { output } = await exec('git branch --color', { output: OutputMode.Capture });
  return `  ${output}\n`;
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
