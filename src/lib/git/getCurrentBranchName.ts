import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

export async function getCurrentBranchName (): Promise<string> {
  return executeAndGetStdout(
    'git',
    [ 'branch', '--show-current' ],
    { shouldTruncateTrailingLineBreak: true },
  );
}
