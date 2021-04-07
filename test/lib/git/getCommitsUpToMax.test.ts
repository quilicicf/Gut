import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getCommitsUpToMax } from '../../../src/lib/git/getCommitsUpToMax.ts';

Deno.test(applyStyle(__`@int ${`${LOCATION}/getCommitsUpToMax`}`, [ theme.strong ]), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getCommitsUpToMax');

  const { subject: oldestCommitSubject } = await commitShit(repository, 1);
  const { subject: latestCommitSubject } = await commitShit(repository, 2);

  const commits = await getCommitsUpToMax(2, false);
  const reversedCommits = await getCommitsUpToMax(2, true);

  await deleteRepositories(repository);

  assertEquals(commits.length, 2);
  assertEquals(commits[ 0 ].subject, latestCommitSubject);
  assertEquals(commits[ 1 ].subject, oldestCommitSubject);

  assertEquals(reversedCommits[ 0 ].subject, oldestCommitSubject);
  assertEquals(reversedCommits[ 1 ].subject, latestCommitSubject);

  await endTestLogs();
});
