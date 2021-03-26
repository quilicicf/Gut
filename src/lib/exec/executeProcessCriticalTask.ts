import log from '../../dependencies/log.ts';
import { applyStyle, theme } from '../../dependencies/colors.ts';

export async function executeProcessCriticalTask (command: string[], errorMessage?: string) {
  const { success } = await Deno.run({
    cmd: command,
    stdin: 'inherit',
    stdout: 'inherit',
    stderr: 'inherit',
  }).status();

  if (success) { return; }

  await log(Deno.stderr, errorMessage || applyStyle(`Command ${command.join(' ')} failed\n`, [ theme.error ]));
  Deno.exit(1);
}
