import { YargsType } from 'https://deno.land/x/yargs/types.ts';

import { exec, OutputMode } from '../../utils/exec.ts';

const REMOTES_SHORTCUTS: { [ id: string ]: string } = {
  o: 'origin',
  u: 'upstream',
};

export default {
  command: 'divisions',
  aliases: [ 'd' ],
  describe: 'Displays the given remote\'s branches',
  builder: (yargs: YargsType) =>
    yargs.usage(`usage: gut divisions [options]`)
      .option('remote', {
        alias: 'r',
        default: null,
        describe: 'The remote whose branches should be displayed',
        type: 'string',
      }),
  handler: async ({ remote, isTestRun }: { remote?: string, isTestRun: boolean }) => {
    const command = remote
      ? `git branch --remotes --column=always --list "${REMOTES_SHORTCUTS[ remote ] || remote}/*"`
      : 'git branch --color';

    if (isTestRun) {
      const { output } = await exec(command, { output: OutputMode.Capture });
      return output;
    }

    await exec(command, { output: OutputMode.StdOut });
    return ''; // Consistent return, ignored by yargs anyway
  },
};
