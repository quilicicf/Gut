import { Branch } from '../../../src/lib/branch/Branch.ts';

interface TestBranch {
  name: string;
  branch: Branch;
  issueId: string;
  parent?: string;
}

export const LOCATION = 'utils/branch';

export const BRANCHES: { [ key: string ]: TestBranch } = {
  MASTER: {
    name: 'master',
    branch: { fragments: [ { description: 'master' } ] },
    issueId: '',
    parent: undefined,
  },
  SIMPLE: {
    name: '1.2.3',
    branch: { fragments: [ { description: '1.2.3' } ] },
    issueId: '',
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
    issueId: '',
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
    issueId: 'TAD-315',
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
    issueId: 'TAD-316',
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
    issueId: 'TAD-315',
    parent: 'master',
  },
};
