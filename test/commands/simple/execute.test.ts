import { resolve } from '../../../src/dependencies/path.ts';
import { exec, OutputMode } from '../../../src/dependencies/exec.ts';
import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { assertEquals } from '../../utils/assert.ts';
import { commitShit, deleteRepositories, initializeRepository } from '../../utils/setup.ts';

import { Branch, stringifyBranch } from '../../../src/lib/branch.ts';

import { handler as execute, test } from '../../../src/commands/simple/execute.ts';
import { FullGutConfiguration } from '../../../src/configuration.ts';

const { DUMMY_COMMIT_MESSAGE } = test;
const command = 'gut execute';

const CONFIGURATION: FullGutConfiguration = {
  global: {
    tools: {},
    preferredGitServer: 'github',
    forgePath: '/tmp',
  },
  repository: {
    reviewTool: 'github',
    shouldUseEmojis: true,
    shouldUseIssueNumbers: true,
  },
};

Deno.test(applyStyle(__`@int ${command} should commit with emoji & issue number`, [ theme.strong ]), async () => {
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_execute');
  await commitShit(testRepositoryPath, 1);

  const testEmoji = ':new:';
  const issueId = 'TEST-123';
  const branch: Branch = {
    fragments: [ { description: 'test', issueId } ],
  };
  const branchName = stringifyBranch(branch);

  await exec(`git checkout -b ${branchName}`, { output: OutputMode.None });
  await Deno.writeTextFile(resolve(testRepositoryPath, 'aFile'), 'whatever');
  await exec('git add . -A', { output: OutputMode.None });

  await execute({ isTestRun: true, configuration: CONFIGURATION, testEmoji });
  const { output: commitMessage } = await exec('git log --max-count=1 --pretty=format:%s', { output: OutputMode.Capture });

  await deleteRepositories(tmpDir, testRepositoryPath);

  assertEquals(commitMessage, `${testEmoji} ${DUMMY_COMMIT_MESSAGE} (${issueId})`);
});
