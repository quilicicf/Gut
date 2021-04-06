import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

export async function getCurrentBranchName (): Promise<string> {
  return executeAndGetStdout([ 'git', 'rev-parse', '--abbrev-ref', 'HEAD' ], true);
  // return executeAndGetStdout([ 'git', 'branch', '--show-current' ], true); // TODO: upgrade git in travis?
}
