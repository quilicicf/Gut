import { isEmpty } from '../../dependencies/ramda.ts';

import { Commit } from './Commit.ts';
import { ASCII_GROUP_SEPARATOR, ASCII_UNIT_SEPARATOR } from './logFormats.ts';

export function asvToJs (asv: string): Commit[] {
  return asv.split(ASCII_GROUP_SEPARATOR)
    .filter(Boolean)
    .map((asvItem: string) => {
      const [
        sha, subject, author, relativeDate, branchesAsString, body
      ] = asvItem.trim().split(ASCII_UNIT_SEPARATOR);
      const branches = isEmpty(branchesAsString) ? [] : branchesAsString.replace(/[()]/g, '').split(',');
      return {
        sha, subject, body, author, relativeDate, branches,
      };
    });
}
