import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

export async function isDirty (): Promise<boolean> {
  const status = await executeAndGetStdout('git', [ 'status', '--short' ], { shouldTrim: true });
  return !!status;
}
