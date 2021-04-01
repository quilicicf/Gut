import log from '../../dependencies/log.ts';
import { applyStyle, theme } from '../../dependencies/colors.ts';

import { ExecOptions } from './ExecOptions.ts';

export async function executeProcessCriticalTask (command: string[], options: ExecOptions = {}) {
  const process = await Deno.run({
    cmd: command,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
    env: options.env,
  });

  const { success } = await process.status();
  process.close();

  if (success) { return; }

  await log(Deno.stderr, options.errorMessage || applyStyle(`Command ${command.join(' ')} failed\n`, [ theme.error ]));
  Deno.exit(1);
}
