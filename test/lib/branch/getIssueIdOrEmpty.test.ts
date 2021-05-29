import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { BRANCHES, LOCATION } from './branch.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getIssueIdOrEmpty } from '../../../src/lib/branch/getIssueIdOrEmpty.ts';

Deno.test(stoyle`@unit ${`${LOCATION}/getIssueIdOrEmpty`}`({ nodes: [ theme.strong ] }), () => {
  Object.values(BRANCHES)
    .forEach(({ name, issueId }) => {
      assertEquals(getIssueIdOrEmpty(name), issueId);
    });
});
