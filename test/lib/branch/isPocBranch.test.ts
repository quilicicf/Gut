import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { BRANCHES, LOCATION } from './branch.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { isPocBranch } from '../../../src/lib/branch/isPocBranch.ts';

Deno.test(stoyle`@unit ${`${LOCATION}/isPocBranch`}`({ nodes: [ theme.strong ] }), () => {
  assertEquals(isPocBranch(BRANCHES.ONE_FRAGMENT.branch), false);
  assertEquals(isPocBranch(BRANCHES.ONE_FRAGMENT_POC.branch), true);
});
