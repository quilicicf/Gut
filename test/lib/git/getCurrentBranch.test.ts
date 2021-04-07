import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getCurrentBranch } from '../../../src/lib/git/getCurrentBranch.ts';

Deno.test(applyStyle(__`@int ${`${LOCATION}/getCurrentBranch`}`, [ theme.strong ]), async () => {
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
