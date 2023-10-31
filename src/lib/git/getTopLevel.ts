import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

export async function getTopLevel (): Promise<string> {
  return executeAndGetStdout('git', [ 'rev-parse', '--show-toplevel' ], { shouldTruncateTrailingLineBreak: true });
}
