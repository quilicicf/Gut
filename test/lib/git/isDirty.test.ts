import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assert } from '../../utils/assert.ts';

import { isDirty } from '../../../src/lib/git/isDirty.ts';
import { resolve } from '../../../src/dependencies/path.ts';

Deno.test(applyStyle(__`@int ${`${LOCATION}/isDirty`}`, [ theme.strong ]), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_isDirty');

  await commitShit(repository, 1);

  const isVirginRepositoryDirty = await isDirty();

  await Deno.writeTextFile(resolve(repository.path, 'dirtyFile'), 'dirt');

  const isDirtyRepositoryDirty = await isDirty();

  await deleteRepositories(repository);

  assert(!isVirginRepositoryDirty, 'The repository is NOT dirty');
  assert(isDirtyRepositoryDirty, 'The repository IS dirty');
  await endTestLogs();
});
