import { Branch } from './Branch.ts';

export function getParentBranch (branch: Branch): Branch {
  if (branch.fragments.length <= 1) {
    throw Error(`This branch can't have a parent, it has only ${branch.fragments.length} fragment`);
  }

  return { fragments: branch.fragments.slice(0, -1) };
}
