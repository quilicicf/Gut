import log from '../../dependencies/log.ts';
import { getPermissionOrExit } from '../getPermissionOrExit.ts';
import { stoyleGlobal, theme } from '../../dependencies/stoyle.ts';

import { ExecOptions } from './ExecOptions.ts';

export async function executeProcessCriticalTask (command: string, args: string[], options: ExecOptions = {}) {
  await getPermissionOrExit({ name: 'run', command });

  const process = await new Deno.Command(
    command,
    {
      args,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
      env: options.env,
    },
  );

  const { success } = await process.output();
  if (success) { return; }

  await log(Deno.stderr, options.errorMessage || stoyleGlobal`Command ${command} ${args.join(' ')} failed\n`(theme.error));
  Deno.exit(1);
}
