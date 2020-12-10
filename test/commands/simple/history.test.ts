import { exec, OutputMode } from '../../../src/dependencies/exec.ts';
import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { assertEquals } from '../../utils/assert.ts';
import { handler as history } from '../../../src/commands/simple/history.ts';
import { initializeRepository, commitShit, deleteRepositories } from '../../utils/setup.ts';

const command = 'gut history';

Deno.test(applyStyle(__`@int ${command} should limit commits to max number`, [ theme.strong ]), async () => {
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_history_number');
  await commitShit(testRepositoryPath, 1);
  await commitShit(testRepositoryPath, 2);

  const output = await history({
    isTestRun: true, format: 'subject', number: 2, reverse: false,
  });

  await deleteRepositories(tmpDir, testRepositoryPath);

  assertEquals(output.map(({ subject }) => subject), [ 'Commit #2', 'Commit #1' ]);
});

Deno.test(applyStyle(__`@int ${command} should show commits in reverse order`, [ theme.strong ]), async () => {
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_history_reverse');
  await commitShit(testRepositoryPath, 1);
  await commitShit(testRepositoryPath, 2);

  const output = await history({
    isTestRun: true, format: 'subject', number: 10, reverse: true,
  });

  await deleteRepositories(tmpDir, testRepositoryPath);

  assertEquals(output.map(({ subject }) => subject), [ 'Commit #1', 'Commit #2' ]);
});

Deno.test(applyStyle(__`@int ${command} should show commits from base branch`, [ theme.strong ]), async () => {
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_history_fromBaseBranch');
  await commitShit(testRepositoryPath, 1);
  await exec('git checkout -b master__anotherBranch', { output: OutputMode.None });
  await commitShit(testRepositoryPath, 2);

  const output = await history({
    isTestRun: true, format: 'subject', number: 10, reverse: false, fromBaseBranch: true,
  });

  await deleteRepositories(tmpDir, testRepositoryPath);

  assertEquals(output.map(({ subject }) => subject), [ 'Commit #2' ]);
});
