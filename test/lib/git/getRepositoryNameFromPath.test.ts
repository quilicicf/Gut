import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getRepositoryNameFromPath } from '../../../src/lib/git/getRepositoryNameFromPath.ts';

Deno.test(stoyle`@int ${`${LOCATION}/getRepositoryNameFromPath`}`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getRepositoryFromPath');

  await commitShit(repository, 1);

  const name = await getRepositoryNameFromPath();

  await deleteRepositories(repository);

  assertEquals(name, repository.name);
  await endTestLogs();
});
