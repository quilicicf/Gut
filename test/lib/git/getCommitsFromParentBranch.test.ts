import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';
import { getCommitsFromParentBranch } from '../../../src/lib/git/getCommitsFromParentBranch.ts';

Deno.test(applyStyle(__`@int ${`${LOCATION}/getCommitsFromParentBranch`}`, [ theme.strong ]), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getCommitsFromParentBranch');

  await commitShit(repository, 1);

  await executeProcessCriticalTask([ 'git', 'checkout', '-b', 'master__devBranch' ]);

  const { subject: oldestCommitSubject } = await commitShit(repository, 2);
  const { subject: latestCommitSubject } = await commitShit(repository, 3);

  const commits = await getCommitsFromParentBranch(false);
  const reversedCommits = await getCommitsFromParentBranch(true);

  await deleteRepositories(repository);

  assertEquals(commits.length, 2);
  assertEquals(commits[ 0 ].subject, latestCommitSubject);
  assertEquals(commits[ 1 ].subject, oldestCommitSubject);

  assertEquals(reversedCommits[ 0 ].subject, oldestCommitSubject);
  assertEquals(reversedCommits[ 1 ].subject, latestCommitSubject);
  await endTestLogs();
});
