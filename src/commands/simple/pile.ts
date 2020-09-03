import { YargsType } from 'https://deno.land/x/yargs/types.ts';

import { moveUpTop } from '../../utils/git.ts';
import { exec, OutputMode } from '../../utils/exec.ts';

export default {
  command: 'pile',
  aliases: [ 'p' ],
  describe: 'Adds all changes in the repository',
  builder: (yargs: YargsType) => yargs.usage(`usage: gut pile [options]`),
  handler: async ({ isTestRun }: { isTestRun: boolean }) => {
    await moveUpTop();
    await exec('git add . --all', { output: OutputMode.None });
    const command = 'git -c color.status=always status --short --branch';

    if (isTestRun) {
      const { output } = await exec(command, { output: OutputMode.Capture });
      return output;
    }

    await exec(command, { output: OutputMode.StdOut });
    return ''; // Consistent return, ignored by yargs anyway
  },
};
