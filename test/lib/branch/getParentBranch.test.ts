import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { BRANCHES, LOCATION } from './branch.utils.ts';
import { assertEquals, assertThrows } from '../../utils/assert.ts';

import { getParentBranch } from '../../../src/lib/branch/getParentBranch.ts';
import { stringifyBranch } from '../../../src/lib/branch/stringifyBranch.ts';

Deno.test(stoyle`@unit ${`${LOCATION}/getParentBranch`}`({ nodes: [ theme.strong ] }), () => {
  Object.values(BRANCHES)
    .forEach(({ branch, parent }) => {
      if (!parent) {
        assertThrows(() => getParentBranch(branch), Error, 'This branch can\'t have a parent');
      } else {
        const actualParent = getParentBranch(branch);
        assertEquals(stringifyBranch(actualParent), parent);
      }
    });
});
