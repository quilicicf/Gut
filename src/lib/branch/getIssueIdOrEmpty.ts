import { parseBranchName } from './parseBranchName.ts';

export function getIssueIdOrEmpty (branchName: string): string {
  const { fragments } = parseBranchName(branchName);
  return fragments.reverse()
    .map((fragment) => fragment.issueId)
    .find(Boolean) || '';
}
