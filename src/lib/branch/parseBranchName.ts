import { Branch, BranchFragment } from './Branch.ts';

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
