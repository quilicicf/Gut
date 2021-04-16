import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getRepositoryNameFromPath } from '../../../src/lib/git/getRepositoryNameFromPath.ts';

Deno.test(applyStyle(__`@int ${`${LOCATION}/getRepositoryNameFromPath`}`, [ theme.strong ]), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getRepositoryFromPath');

  await commitShit(repository, 1);

  const name = await getRepositoryNameFromPath();

  await deleteRepositories(repository);

  assertEquals(name, repository.name);
  await endTestLogs();
});
