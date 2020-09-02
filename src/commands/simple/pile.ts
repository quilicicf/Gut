import { YargsType } from 'https://deno.land/x/yargs/deno.ts';
import { exec, OutputMode } from 'https://deno.land/x/exec/mod.ts';

import { moveUpTop } from '../../utils/git.ts';

export default {
  command: 'pile',
  aliases: [ 'p' ],
  describe: 'Adds all changes in the repository',
  builder: (yargs: YargsType) => yargs.usage(`usage: gut pile [options]`),
  handler: async () => {
    await moveUpTop();
    await exec('git add . --all', { output: OutputMode.StdOut });
    await exec('git -c color.status=always status --short --branch', { output: OutputMode.StdOut });
  },
};
