import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { BRANCHES, LOCATION } from './branch.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { parseBranchName } from '../../../src/lib/branch/parseBranchName.ts';

Deno.test(stoyle`@unit ${`${LOCATION}/parseBranchName`}`({ nodes: [ theme.strong ] }), () => {
  Object.values(BRANCHES)
    .forEach(({ name, branch }) => {
      assertEquals(parseBranchName(name), branch);
    });
});
