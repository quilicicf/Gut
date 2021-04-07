import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { BRANCHES, LOCATION } from './branch.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { parseBranchName } from '../../../src/lib/branch/parseBranchName.ts';

Deno.test(applyStyle(__`@unit ${`${LOCATION}/parseBranchName`}`, [ theme.strong ]), () => {
  Object.values(BRANCHES)
    .forEach(({ name, branch }) => {
      assertEquals(parseBranchName(name), branch);
    });
});
