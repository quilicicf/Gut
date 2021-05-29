import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { BRANCHES, LOCATION } from './branch.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { stringifyBranch } from '../../../src/lib/branch/stringifyBranch.ts';

Deno.test(stoyle`@unit ${`${LOCATION}/stringifyBranch`}`({ nodes: [ theme.strong ] }), () => {
  Object.values(BRANCHES)
    .forEach(({ name, branch }) => {
      assertEquals(stringifyBranch(branch), name);
    });
});
