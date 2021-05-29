import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import {
  ShitCommit, commitShit,
  initializeRepository, deleteRepositories,
  endTestLogs, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals, assertMatch } from '../../utils/assert.ts';

import { getDiffBetweenRefs } from '../../../src/lib/git/getDiffBetweenRefs.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';

const generateExpectedFileDiffRegex = ({ fileName, fileContent }: ShitCommit): RegExp => new RegExp(
  [
    `diff --git a/${fileName} b/${fileName}`,
    'new file mode 100644',
    'index 0000000..[a-f0-9]+',
    '--- /dev/null',
    `\\+\\+\\+ b/${fileName}`,
    '@@ -0,0 \\+1 @@',
    `\\+${fileContent}`,
  ].join('\n'),
);

Deno.test(stoyle`@int ${`${LOCATION}/getDiffBetweenRefs`}`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getDiffBetweenRefs');

  await commitShit(repository, 1);

  await executeProcessCriticalTask([ 'git', 'checkout', '-b', 'other-ref' ]);

  const commitTwo = await commitShit(repository, 2);
  const commitThree = await commitShit(repository, 3);

  const diffBetweenBranches = await getDiffBetweenRefs('master', 'other-ref');
  const diffWithHead = await getDiffBetweenRefs('HEAD~1', 'HEAD');
  const failedDiff = await getDiffBetweenRefs('HEAD', 'dunt-exicht');

  await deleteRepositories(repository);

  assertMatch(diffBetweenBranches, generateExpectedFileDiffRegex(commitTwo));
  assertMatch(diffBetweenBranches, generateExpectedFileDiffRegex(commitThree));

  assertMatch(diffWithHead, generateExpectedFileDiffRegex(commitThree));

  assertEquals(failedDiff, '');
  await endTestLogs();
});
