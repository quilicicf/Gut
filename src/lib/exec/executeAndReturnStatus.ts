import { getPermissionOrExit } from '../getPermissionOrExit.ts';

export async function executeAndReturnStatus (command: string, args: string[]): Promise<boolean> {
  await getPermissionOrExit({ name: 'run', command });
  const process = new Deno.Command(
    command,
    {
      args,
      stdin: 'inherit',
      stdout: 'inherit',
      stderr: 'inherit',
    },
  ).spawn();
  const { success } = await process.output();
  return success;
}
