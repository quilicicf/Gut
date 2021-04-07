import { Commit } from '../../../src/lib/git/Commit.ts';

export const LOCATION = 'utils/git';

export const TEST_COMMIT: Commit = {
  sha: '49cd5b309e581061536bb0895cea53ae85acfcb0',
  author: 'quilicicf',
  subject: ':new: Creating something',
  relativeDate: '11 days ago',
  branches: [
    'HEAD -> master',
    'origin/master',
  ],
};
