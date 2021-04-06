import { isEmpty } from '../../dependencies/ramda.ts';

import { Commit } from './Commit.ts';

export function psvToJs (psv: string): Commit[] {
  return psv.split('\n')
    .filter(Boolean)
    .map((psvItem: string) => {
      const [ sha, subject, author, relativeDate, branchesAsString ] = psvItem.split('|');
      const branches = isEmpty(branchesAsString) ? [] : branchesAsString.replace(/[()]/g, '').split(',');
      return {
        sha, subject, author, relativeDate, branches,
      };
    });
}
