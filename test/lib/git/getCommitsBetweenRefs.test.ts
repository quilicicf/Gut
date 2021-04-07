import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getCommitsBetweenRefs } from '../../../src/lib/git/getCommitsBetweenRefs.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';

Deno.test(applyStyle(__`@int ${`${LOCATION}/getCommitsBetweenRefs`}`, [ theme.strong ]), async () => {
  await startTestLogs();
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_getCommitsBetweenRefs');

  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', 'Mkay' ],
    [ 'git', 'checkout', '-b', 'other-ref' ],
  ]);

  const oldestCommitSubject = await commitShit(testRepositoryPath, 1);
  const latestCommitSubject = await commitShit(testRepositoryPath, 2);

  const commits = await getCommitsBetweenRefs('master', 'other-ref', false);
  const reversedCommits = await getCommitsBetweenRefs('master', 'other-ref', true);

  await deleteRepositories(tmpDir, testRepositoryPath);

  assertEquals(commits.length, 2);
  assertEquals(commits[ 0 ].subject, latestCommitSubject);
  assertEquals(commits[ 1 ].subject, oldestCommitSubject);

  assertEquals(reversedCommits[ 0 ].subject, oldestCommitSubject);
  assertEquals(reversedCommits[ 1 ].subject, latestCommitSubject);

  await endTestLogs();
});
