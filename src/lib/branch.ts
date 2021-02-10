export interface BranchFragment {
  isPoc?: boolean;
  issueId?: string;
  description: string;
}

export interface Branch {
  fragments: BranchFragment[]
}

const FRAGMENT_REGEX = /^(POC--)?(?:([^_]+)_)?(.*)/;

function parseBranchFragment (branchFragmentAsString: string): BranchFragment {
  const [ , pocTag, issueId, description ] = FRAGMENT_REGEX.exec(branchFragmentAsString) || [];
  return {
    ...(pocTag ? { isPoc: true } : {}),
    ...(issueId ? { issueId } : {}),
    description,
  };
}

export function parseBranchName (branchName: string): Branch {
  const fragmentsAsString = branchName.split(/__/g);
  const fragments = fragmentsAsString.map((fragmentAsString) => parseBranchFragment(fragmentAsString));
  return { fragments };
}

export function getIssueIdOrEmpty (branchName: string): string {
  const { fragments } = parseBranchName(branchName);
  return fragments.reverse()
    .map((fragment) => fragment.issueId)
    .find(Boolean) || '';
}

export function stringifyBranch (branch: Branch): string {
  return branch.fragments
    .map(({ isPoc, issueId, description }) => {
      const pocPart = isPoc ? 'POC--' : '';
      const issueIdPart = issueId ? `${issueId}_` : '';
      return `${pocPart}${issueIdPart}${description}`;
    })
    .join('__');
}

export function getParentBranch (branch: Branch): Branch {
  if (branch.fragments.length <= 1) {
    throw Error(`This branch can't have a parent, it has only ${branch.fragments.length} fragment`);
  }

  return { fragments: branch.fragments.slice(0, -1) };
}

export function isPocBranch (branch: Branch): boolean {
  return branch.fragments.some((fragment) => fragment.isPoc);
}
