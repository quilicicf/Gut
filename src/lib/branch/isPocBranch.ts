import { Branch } from './Branch.ts';

export function isPocBranch (branch: Branch): boolean {
  return branch.fragments.some((fragment) => fragment.isPoc);
}
