import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { assertEquals } from '../../utils/assert.ts';
import { handler as history } from '../../../src/commands/simple/history.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';
import {
  initializeRepository, commitShit, deleteRepositories, startTestLogs, endTestLogs,
} from '../../utils/setup.ts';

const command = 'gut history';

Deno.test(stoyle`@int ${command} should limit commits to max number`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_history_number');
  await commitShit(repository, 1);
  await commitShit(repository, 2);

  const output = await history({
    format: 'subject', number: 2, reverse: false,
  });

  await deleteRepositories(repository);

  await endTestLogs();
  assertEquals(output.map(({ subject }) => subject), [ 'Commit_#2', 'Commit_#1' ]);
});

Deno.test(stoyle`@int ${command} should show commits in reverse order`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_history_reverse');
  await commitShit(repository, 1);
  await commitShit(repository, 2);

  const output = await history({
    format: 'subject', number: 10, reverse: true,
  });

  await deleteRepositories(repository);

  await endTestLogs();
  assertEquals(output.map(({ subject }) => subject), [ 'Commit_#1', 'Commit_#2' ]);
});

Deno.test(stoyle`@int ${command} should show commits from base branch`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_history_fromBaseBranch');
  await commitShit(repository, 1);
  await executeProcessCriticalTask('git', [ 'checkout', '-b', 'master__anotherBranch' ]);
  await commitShit(repository, 2);

  const output = await history({
    format: 'subject', number: 10, reverse: false, fromParentBranch: true,
  });

  await deleteRepositories(repository);

  await endTestLogs();
  assertEquals(output.map(({ subject }) => subject), [ 'Commit_#2' ]);
});
