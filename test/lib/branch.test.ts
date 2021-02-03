import { __, applyStyle, theme } from '../../src/dependencies/colors.ts';

import { assertEquals, assertThrows } from '../utils/assert.ts';
import {
  parseBranchName, Branch, stringifyBranch, isPocBranch, getParentBranch,
} from '../../src/lib/branch.ts';

const BRANCHES: { [ key: string ]: { name: string, branch: Branch, parent?: string } } = {
  MASTER: {
    name: 'master',
    branch: { fragments: [ { description: 'master' } ] },
    parent: undefined,
  },
  SIMPLE: {
    name: '1.2.3',
    branch: { fragments: [ { description: '1.2.3' } ] },
    parent: undefined,
  },
  ONE_FRAGMENT: {
    name: 'master__oneThingy',
    branch: {
      fragments: [
        { description: 'master' },
        { description: 'oneThingy' },
      ],
    },
    parent: 'master',
  },
  ONE_FRAGMENT_WITH_TICKET_ID: {
    name: 'master__TAD-315_oneThingy',
    branch: {
      fragments: [
        { description: 'master' },
        { description: 'oneThingy', issueId: 'TAD-315' },
      ],
    },
    parent: 'master',
  },
  TWO_FRAGMENTS_WITH_TICKET_ID: {
    name: 'master__TAD-315_oneThingy__TAD-316_subTask',
    branch: {
      fragments: [
        { description: 'master' },
        { description: 'oneThingy', issueId: 'TAD-315' },
        { description: 'subTask', issueId: 'TAD-316' },
      ],
    },
    parent: 'master__TAD-315_oneThingy',
  },
  ONE_FRAGMENT_POC: {
    name: 'master__POC--TAD-315_oneThingy',
    branch: {
      fragments: [
        { description: 'master' },
        { description: 'oneThingy', issueId: 'TAD-315', isPoc: true },
      ],
    },
    parent: 'master',
  },
};

const testedUnit = 'utils/branch';
Deno.test(applyStyle(__`@unit ${testedUnit} should parse branch`, [ theme.strong ]), () => {
  Object.values(BRANCHES)
    .forEach(({ name, branch }) => {
      assertEquals(parseBranchName(name), branch);
    });
});

Deno.test(applyStyle(__`@unit ${testedUnit} should stringify branch`, [ theme.strong ]), () => {
  Object.values(BRANCHES)
    .forEach(({ name, branch }) => {
      assertEquals(stringifyBranch(branch), name);
    });
});

Deno.test(applyStyle(__`@unit ${testedUnit} should detect PoC branches`, [ theme.strong ]), () => {
  assertEquals(isPocBranch(BRANCHES.ONE_FRAGMENT.branch), false);
  assertEquals(isPocBranch(BRANCHES.ONE_FRAGMENT_POC.branch), true);
});

Deno.test(applyStyle(__`@unit ${testedUnit} should get branch parent`, [ theme.strong ]), () => {
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
