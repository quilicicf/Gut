import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

export async function getRemotes (): Promise<string[]> {
  const output = await executeAndGetStdout([ 'git', 'remote', 'show' ], { shouldTruncateTrailingLineBreak: true });
  return output === '' ? [] : output.split(/\s/);
}
