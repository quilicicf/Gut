import { Branch } from './Branch.ts';

export function stringifyBranch (branch: Branch): string {
  return branch.fragments
    .map(({ isPoc, issueId, description }) => {
      const pocPart = isPoc ? 'POC--' : '';
      const issueIdPart = issueId ? `${issueId}_` : '';
      return `${pocPart}${issueIdPart}${description}`;
    })
    .join('__');
}
