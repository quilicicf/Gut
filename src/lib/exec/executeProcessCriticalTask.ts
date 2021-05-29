import log from '../../dependencies/log.ts';
import { getPermissionOrExit } from '../getPermissionOrExit.ts';
import { stoyleGlobal, theme } from '../../dependencies/stoyle.ts';

import { ExecOptions } from './ExecOptions.ts';

export async function executeProcessCriticalTask (command: string[], options: ExecOptions = {}) {
  const [ programName ] = command;
  await getPermissionOrExit({ name: 'run', command: programName });

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

  await log(Deno.stderr, options.errorMessage || stoyleGlobal`Command ${command.join(' ')} failed\n`(theme.error));
  Deno.exit(1);
}
