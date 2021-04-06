import { executeAndReturnStatus } from '../exec/executeAndReturnStatus.ts';

export async function isDirty (): Promise<boolean> {
  return executeAndReturnStatus([ 'git', 'diff', '--quiet', '--exit-code' ]);
}
