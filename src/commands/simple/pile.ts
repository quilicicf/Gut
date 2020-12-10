import log from '../../dependencies/log.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';

import { moveUpTop } from '../../lib/git.ts';

export const command = 'pile';
export const aliases = [ 'p' ];
export const describe = 'Adds all changes in the repository';

export function builder (yargs: any) {
  return yargs.usage('usage: gut pile [options]');
}

export async function handler ({ isTestRun }: { isTestRun: boolean }) {
  await moveUpTop();
  await exec('git add . --all', { output: OutputMode.None });

  if (isTestRun) {
    const { output } = await exec('git -c color.status=never status --short --branch', { output: OutputMode.Capture });
    return output;
  }

  const { output } = await exec('git -c color.status=always status --short --branch', { output: OutputMode.Capture });
  await log(Deno.stdout, output);
  return output;
}
