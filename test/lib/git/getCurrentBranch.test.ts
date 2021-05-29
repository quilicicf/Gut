import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getCurrentBranch } from '../../../src/lib/git/getCurrentBranch.ts';

Deno.test(stoyle`@int ${`${LOCATION}/getCurrentBranch`}`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getCurrentBranch');

  await commitShit(repository, 1);

  const currentBranch = await getCurrentBranch();

  await deleteRepositories(repository);

  assertEquals(currentBranch, {
    fragments: [ {
      description: 'master',
    } ],
  });

  await endTestLogs();
});
