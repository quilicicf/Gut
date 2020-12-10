export interface BranchFragment {
  isPoc?: boolean;
  ticketId?: string;
  description: string;
}

export interface Branch {
  fragments: BranchFragment[]
}

const FRAGMENT_REGEX = /^(POC--)?(?:([^_]+)_)?(.*)/;

function parseBranchFragment (branchFragmentAsString: string): BranchFragment {
  const [ , pocTag, ticketId, description ] = FRAGMENT_REGEX.exec(branchFragmentAsString) || [];
  return {
    ...(pocTag ? { isPoc: true } : {}),
    ...(ticketId ? { ticketId } : {}),
    description,
  };
}

export function parseBranchName (branchName: string): Branch {
  const fragmentsAsString = branchName.split(/__/g);
  const fragments = fragmentsAsString.map((fragmentAsString) => parseBranchFragment(fragmentAsString));
  return { fragments };
}

export function stringifyBranch (branch: Branch): string {
  return branch.fragments
    .map(({ isPoc, ticketId, description }) => {
      const pocPart = isPoc ? 'POC--' : '';
      const ticketIdPart = ticketId ? `${ticketId}_` : '';
      return `${pocPart}${ticketIdPart}${description}`;
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
