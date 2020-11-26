import { exec, OutputMode } from '../../dependencies/exec.ts';

const REMOTES_SHORTCUTS: { [ id: string ]: string } = {
  o: 'origin',
  u: 'upstream',
};

export default {
  command: 'divisions',
  aliases: [ 'd' ],
  describe: 'Displays the given remote\'s branches',
  builder: (yargs: any) =>
    yargs.usage(`usage: gut divisions [options]`)
      .option('remote', {
        alias: 'r',
        default: null,
        describe: 'The remote whose branches should be displayed',
        type: 'string',
      }),
  handler: async ({ remote, isTestRun }: { remote?: string, isTestRun: boolean }) => {
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
  },
};
