import { Commit } from './Commit.ts';
import { getMergeBaseFromParent } from './getMergeBaseFromParent.ts';
import { getCommitsBetweenRefs } from './getCommitsBetweenRefs.ts';

export async function getCommitsFromParentBranch (shouldReverse: boolean): Promise<Commit[]> {
  const mergeBase = await getMergeBaseFromParent();
  return getCommitsBetweenRefs(mergeBase, 'HEAD', shouldReverse);
}
