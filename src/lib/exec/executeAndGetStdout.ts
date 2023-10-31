import { getPermissionOrExit } from '../getPermissionOrExit.ts';

interface _ExecuteAndGetStdoutOptions {
  shouldTrim?: boolean;
  shouldTruncateTrailingLineBreak?: boolean;
}

export type ExecuteAndGetStdoutOptions = _ExecuteAndGetStdoutOptions;

export async function executeAndGetStdout (command: string, args: string[], options: ExecuteAndGetStdoutOptions) {
  await getPermissionOrExit({ name: 'run', command });

  const process = new Deno.Command(
    command,
    {
      args,
      stdin: 'inherit',
      stdout: 'piped',
      stderr: 'null',
    },
  ).spawn();

  const { stdout: output } = await process.output();

  const truncateTrailingLineBreak = (input: string) => input.replace(/\n$/, '');
  const trim = (input: string) => input.trim();
  const transformers = [
    ...(options.shouldTruncateTrailingLineBreak ? [ truncateTrailingLineBreak ] : []),
    ...(options.shouldTrim ? [ trim ] : []),
  ];

  const decodedOutput = new TextDecoder().decode(output);
  return transformers.reduce((seed, operation) => operation(seed), decodedOutput);
}
