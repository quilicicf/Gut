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

import { getMergeBaseFromParent } from '../../../src/lib/git/getMergeBaseFromParent.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';
import { executeAndGetStdout } from '../../../src/lib/exec/executeAndGetStdout.ts';

Deno.test(stoyle`@int ${`${LOCATION}/getMergeBaseFromParent`}`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getMergeBaseFromParent');

  await commitShit(repository, 1);
  const lastMasterCommitSha = await executeAndGetStdout(
    'git',
    [ 'log', '--max-count', '1', '--pretty=format:%H' ],
    { shouldTruncateTrailingLineBreak: true },
  );

  await executeProcessCriticalTask([ 'git', 'checkout', '-b', 'master__devBranch' ]);

  await commitShit(repository, 2);

  const mergeBase = await getMergeBaseFromParent();

  await deleteRepositories(repository);

  assertEquals(mergeBase, lastMasterCommitSha);
  await endTestLogs();
});
