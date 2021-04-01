import { resolve } from '../../../src/dependencies/path.ts';
import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { assertEquals } from '../../utils/assert.ts';
import {
  commitShit, deleteRepositories, endTestLogs, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';

import { Branch, stringifyBranch } from '../../../src/lib/branch.ts';
import { executeAndGetStdout } from '../../../src/lib/exec/executeAndGetStdout.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';

import { test } from '../../../src/commands/simple/execute.ts';

const { commitWithMessage } = test;
const command = 'gut execute';

Deno.test(applyStyle(__`@int ${command} should commit with message`, [ theme.strong ]), async () => {
  await startTestLogs();
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_execute_message');
  await commitShit(testRepositoryPath, 1);

  const branch: Branch = {
    fragments: [ { description: 'test', issueId: 'TEST-123' } ],
  };
  const branchName = stringifyBranch(branch);

  await executeProcessCriticalTask([ 'git', 'checkout', '-b', branchName ]);
  await Deno.writeTextFile(resolve(testRepositoryPath, 'aFile'), 'whatever');
  await executeProcessCriticalTask([ 'git', 'add', '.', '--all' ]);

  const expectedCommitMessage = ':construction: Test commit';
  await commitWithMessage(expectedCommitMessage);
  const actualCommitMessage = await executeAndGetStdout([ 'git', 'log', '--max-count=1', '--pretty=format:%s' ]);

  await deleteRepositories(tmpDir, testRepositoryPath);

  await endTestLogs();
  assertEquals(actualCommitMessage, expectedCommitMessage);
});
