import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { BRANCHES, LOCATION } from './branch.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { stringifyBranch } from '../../../src/lib/branch/stringifyBranch.ts';

Deno.test(applyStyle(__`@unit ${`${LOCATION}/stringifyBranch`}`, [ theme.strong ]), () => {
  Object.values(BRANCHES)
    .forEach(({ name, branch }) => {
      assertEquals(stringifyBranch(branch), name);
    });
});
