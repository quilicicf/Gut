import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import {
  commitShit,
  deleteRepositories,
  endTestLogs,
  initializeRepository,
  startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getCommitsBetweenRefs } from '../../../src/lib/git/getCommitsBetweenRefs.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';

Deno.test(stoyle`@int ${`${LOCATION}/getCommitsBetweenRefs`}`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getCommitsBetweenRefs');

  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'add', '.', '--all' ] },
    { command: 'git', args: [ 'commit', '--message', 'Mkay' ] },
    { command: 'git', args: [ 'checkout', '-b', 'other-ref' ] },
  ]);

  const { subject: oldestCommitSubject } = await commitShit(repository, 1);
  const { subject: latestCommitSubject } = await commitShit(repository, 2);

  const commits = await getCommitsBetweenRefs('master', 'other-ref', false);
  const reversedCommits = await getCommitsBetweenRefs('master', 'other-ref', true);

  await deleteRepositories(repository);

  assertEquals(commits.length, 2);
  assertEquals(commits[ 0 ].subject, latestCommitSubject);
  assertEquals(commits[ 1 ].subject, oldestCommitSubject);

  assertEquals(reversedCommits[ 0 ].subject, oldestCommitSubject);
  assertEquals(reversedCommits[ 1 ].subject, latestCommitSubject);

  await endTestLogs();
});
