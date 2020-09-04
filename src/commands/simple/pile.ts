import { YargsType } from 'https://deno.land/x/yargs/types.ts';

import { moveUpTop } from '../../lib/git.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';

export default {
  command: 'pile',
  aliases: [ 'p' ],
  describe: 'Adds all changes in the repository',
  builder: (yargs: YargsType) => yargs.usage(`usage: gut pile [options]`),
  handler: async ({ isTestRun }: { isTestRun: boolean }) => {
    await moveUpTop();
    await exec('git add . --all', { output: OutputMode.None });

    const { output } = isTestRun
      ? await exec('git -c color.status=never status --short --branch', { output: OutputMode.Capture })
      : await exec('git -c color.status=always status --short --branch', { output: OutputMode.StdOut });
    return output;
  },
};
