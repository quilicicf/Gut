import { exec, OutputMode } from '../../dependencies/exec.ts';

const REMOTES_SHORTCUTS: { [ id: string ]: string } = {
  o: 'origin',
  u: 'upstream',
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
  if (remote) {
    const filter = `--list "${REMOTES_SHORTCUTS[ remote ] || remote}/*"`;
    const { output } = isTestRun
      ? await exec(`git -c color.branch=never branch --remotes --column=always ${filter}`, { output: OutputMode.Capture })
      : await exec(`git --remotes --column=always ${filter}`, { output: OutputMode.StdOut });
    return output;
  }

  const { output } = isTestRun
    ? await exec('git -c color.branch=never branch', { output: OutputMode.Capture })
    : await exec('git branch --color', { output: OutputMode.StdOut });
  return output;
}
