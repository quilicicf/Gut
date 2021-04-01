export async function executeAndGetStdout (command: string[], truncateTrailingLineBreak: boolean = false) {
  const process = Deno.run({
    cmd: command,
    stdin: 'inherit',
    stdout: 'piped',
    stderr: 'null',
  });

  const output = await process.output();
  process.close();

  const decodedOutput = new TextDecoder().decode(output);

  return truncateTrailingLineBreak
    ? decodedOutput.replace(/\n$/, '')
    : decodedOutput;
}
