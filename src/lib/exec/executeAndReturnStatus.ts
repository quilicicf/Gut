export async function executeAndReturnStatus (command: string[]): Promise<boolean> {
  const process = Deno.run({
    cmd: command,
    stdin: 'inherit',
    stdout: 'null',
    stderr: 'null',
  });

  const { success } = await process.status();
  process.close();

  return success;
}
