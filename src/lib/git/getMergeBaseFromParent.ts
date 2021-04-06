import { parseBranchName } from '../branch/parseBranchName.ts';
import { getParentBranch } from '../branch/getParentBranch.ts';
import { stringifyBranch } from '../branch/stringifyBranch.ts';
import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';
import { getCurrentBranchName } from './getCurrentBranchName.ts';

export async function getMergeBaseFromParent (): Promise<string> { // FIXME: can fail if branch not parsable or orphan
  const currentBranchName = await getCurrentBranchName();
  const currentBranch = parseBranchName(currentBranchName);
  const parentBranch = getParentBranch(currentBranch);
  const parentBranchName = stringifyBranch(parentBranch);
  return executeAndGetStdout([ 'git', 'merge-base', parentBranchName, currentBranchName ], true);
}
