import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

export async function getDiffBetweenRefs (baseRef: string, targetRef: string): Promise<string> {
  return executeAndGetStdout(
    [ 'git', '--no-pager', 'diff', '-U0', '--no-color', `${baseRef}..${targetRef}` ],
  );
}
