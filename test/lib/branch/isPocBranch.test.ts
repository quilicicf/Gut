import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { BRANCHES, LOCATION } from './branch.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { isPocBranch } from '../../../src/lib/branch/isPocBranch.ts';

Deno.test(applyStyle(__`@unit ${`${LOCATION}/isPocBranch`}`, [ theme.strong ]), () => {
  assertEquals(isPocBranch(BRANCHES.ONE_FRAGMENT.branch), false);
  assertEquals(isPocBranch(BRANCHES.ONE_FRAGMENT_POC.branch), true);
});
