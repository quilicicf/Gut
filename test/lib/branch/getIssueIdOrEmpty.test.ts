import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { BRANCHES, LOCATION } from './branch.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getIssueIdOrEmpty } from '../../../src/lib/branch/getIssueIdOrEmpty.ts';

Deno.test(applyStyle(__`@unit ${`${LOCATION}/getIssueIdOrEmpty`}`, [ theme.strong ]), () => {
  Object.values(BRANCHES)
    .forEach(({ name, issueId }) => {
      assertEquals(getIssueIdOrEmpty(name), issueId);
    });
});
