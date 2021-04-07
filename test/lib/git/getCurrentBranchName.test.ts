import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getCurrentBranchName } from '../../../src/lib/git/getCurrentBranchName.ts';

Deno.test(applyStyle(__`@int ${`${LOCATION}/getCurrentBranchName`}`, [ theme.strong ]), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getCurrentBranchName');

  await commitShit(repository, 1);

  const currentBranch = await getCurrentBranchName();

  await deleteRepositories(repository);

  assertEquals(currentBranch, 'master');

  await endTestLogs();
});
