import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

export async function getCurrentBranchName (): Promise<string> {
  return executeAndGetStdout(
    // [ 'git', 'branch', '--show-current' ], // TODO: upgrade git in travis?
    [ 'git', 'rev-parse', '--abbrev-ref', 'HEAD' ],
    { shouldTruncateTrailingLineBreak: true },
  );
}
