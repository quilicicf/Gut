interface _ExecuteAndGetStdoutOptions {
  shouldTrim?: boolean;
  shouldTruncateTrailingLineBreak?: boolean;
}

export type ExecuteAndGetStdoutOptions = _ExecuteAndGetStdoutOptions;

export async function executeAndGetStdout (command: string[], options: ExecuteAndGetStdoutOptions) {
  const process = Deno.run({
    cmd: command,
    stdin: 'inherit',
    stdout: 'piped',
    stderr: 'null',
  });

  const output = await process.output();
  process.close();

  const truncateTrailingLineBreak = (input: string) => input.replace(/\n$/, '');
  const trim = (input: string) => input.trim();
  const transformers = [
    ...(options.shouldTruncateTrailingLineBreak ? [ truncateTrailingLineBreak ] : []),
    ...(options.shouldTrim ? [ trim ] : []),
  ];

  const decodedOutput = new TextDecoder().decode(output);
  return transformers.reduce((seed, operation) => operation(seed), decodedOutput);
}
