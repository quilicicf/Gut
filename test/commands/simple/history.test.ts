import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { assertEquals } from '../../utils/assert.ts';
import { handler as history } from '../../../src/commands/simple/history.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';
import {
  initializeRepository, commitShit, deleteRepositories, startTestLogs, endTestLogs,
} from '../../utils/setup.ts';

const command = 'gut history';

Deno.test(applyStyle(__`@int ${command} should limit commits to max number`, [ theme.strong ]), async () => {
  await startTestLogs();
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_history_number');
  await commitShit(testRepositoryPath, 1);
  await commitShit(testRepositoryPath, 2);

  const output = await history({
    format: 'subject', number: 2, reverse: false,
  });

  await deleteRepositories(tmpDir, testRepositoryPath);

  await endTestLogs();
  assertEquals(output.map(({ subject }) => subject), [ 'Commit_#2', 'Commit_#1' ]);
});

Deno.test(applyStyle(__`@int ${command} should show commits in reverse order`, [ theme.strong ]), async () => {
  await startTestLogs();
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_history_reverse');
  await commitShit(testRepositoryPath, 1);
  await commitShit(testRepositoryPath, 2);

  const output = await history({
    format: 'subject', number: 10, reverse: true,
  });

  await deleteRepositories(tmpDir, testRepositoryPath);

  await endTestLogs();
  assertEquals(output.map(({ subject }) => subject), [ 'Commit_#1', 'Commit_#2' ]);
});

Deno.test(applyStyle(__`@int ${command} should show commits from base branch`, [ theme.strong ]), async () => {
  await startTestLogs();
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_history_fromBaseBranch');
  await commitShit(testRepositoryPath, 1);
  await executeProcessCriticalTask([ 'git', 'checkout', '-b', 'master__anotherBranch' ]);
  await commitShit(testRepositoryPath, 2);

  const output = await history({
    format: 'subject', number: 10, reverse: false, fromParentBranch: true,
  });

  await deleteRepositories(tmpDir, testRepositoryPath);

  await endTestLogs();
  assertEquals(output.map(({ subject }) => subject), [ 'Commit_#2' ]);
});
