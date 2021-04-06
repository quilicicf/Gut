import { Branch } from '../branch/Branch.ts';
import { parseBranchName } from '../branch/parseBranchName.ts';

import { getCurrentBranchName } from './getCurrentBranchName.ts';

export async function getCurrentBranch (): Promise<Branch> {
  const currentBranchName = await getCurrentBranchName();
  return parseBranchName(currentBranchName);
}
