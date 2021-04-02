import log from '../../dependencies/log.ts';

import { moveUpTop } from '../../lib/git.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';
import { executeAndGetStdout } from '../../lib/exec/executeAndGetStdout.ts';

export const command = 'pile';
export const aliases = [ 'p' ];
export const describe = 'Adds all changes in the repository';

export function builder (yargs: any) {
  return yargs.usage('usage: gut pile [options]');
}

export async function handler () {
  await moveUpTop();
  await executeProcessCriticalTask([ 'git', 'add', '.', '--all' ]);

  const output = await executeAndGetStdout([
    'git', '-c', 'color.status=always', 'status', '--short', '--branch',
  ]);

  await log(Deno.stdout, `${output}\n`);

  return output;
}
