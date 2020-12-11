import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';
import { exec, execSequence, OutputMode } from '../../../src/dependencies/exec.ts';

import { assertEquals, fail } from '../../utils/assert.ts';
import {
  commitShit, deleteRepositories, initializeRemote, initializeRepository,
} from '../../utils/setup.ts';

import { handler as thrust } from '../../../src/commands/simple/thrust.ts';

const command = 'gut thrust';
const remoteName = 'origin';

Deno.test(applyStyle(__`@int ${command} should push to a branch`, [ theme.strong ]), async () => {
  const localRepositoryName = 'gut_test_thrust';
  const { tmpDir, testRepositoryPath } = await initializeRepository(localRepositoryName);
  await Deno.writeTextFile('aFile', 'whatever');
  await execSequence([
    'git add . -A',
    'git commit -m "Initialize repository"',
  ], { output: OutputMode.None });

  const originRepositoryPath = await initializeRemote(tmpDir, testRepositoryPath, remoteName);

  const commitSubject = await commitShit(testRepositoryPath, 1);
  const { status, output } = await thrust({ force: false, isTestRun: true });

  if (!status.success) {
    fail(`Pushing failed with status ${status.code} and message:\n${output}`);
  }

  await exec('git checkout origin/master', { output: OutputMode.None });
  const { output: lastCommitSubject } = await exec('git log --max-count 1 --pretty=format:%s', { output: OutputMode.Capture });

  await deleteRepositories(tmpDir, testRepositoryPath, originRepositoryPath);

  assertEquals(lastCommitSubject, commitSubject);
});

Deno.test(applyStyle(__`@int ${command} should force-push to a branch`, [ theme.strong ]), async () => {
  const localRepositoryName = 'gut_test_thrust_force';
  const { tmpDir, testRepositoryPath, testRepositoryName } = await initializeRepository(localRepositoryName);
  await Deno.writeTextFile('aFile', 'whatever');
  await execSequence([
    'git add . -A',
    'git commit -m "Initialize repository"',
  ], { output: OutputMode.None });

  const originRepositoryPath = await initializeRemote(tmpDir, testRepositoryName, testRepositoryPath, remoteName);

  const theFilePath = 'theFile';
  const commitSubject = 'Commit that will be re-done';
  await Deno.writeTextFile(theFilePath, 'whatever, will be re-written');
  await execSequence([
    'git add . -A', // Add all files in the repo
    `git commit -m "${commitSubject}"`, // Create a commit
    `git push --set-upstream ${remoteName} master`, // Push it to remote
    'git reset HEAD~1', // Undo it
  ], { output: OutputMode.None });

  const expectedCommitSubject = 'Commit that was re-done';
  const expectedContentOnMaster = 'Re-written value';
  await Deno.writeTextFile(theFilePath, expectedContentOnMaster);
  await execSequence([
    'git add . -A', // Re-add all its components
    `git commit -m "${expectedCommitSubject}"`, // Re-do it (different sha and content)
  ], { output: OutputMode.None });

  const { status, output } = await thrust({ force: true, isTestRun: true });

  if (!status.success) {
    fail(`Force-pushing failed with status ${status.code} and message:\n${output}`);
  }

  await exec('git checkout origin/master', { output: OutputMode.None });
  const { output: lastCommitSubject } = await exec('git log --max-count 1 --pretty=format:%s', { output: OutputMode.Capture });
  const newContentOnMaster = await Deno.readTextFile(theFilePath);

  await deleteRepositories(tmpDir, testRepositoryPath, originRepositoryPath);

  assertEquals(lastCommitSubject, expectedCommitSubject);
  assertEquals(newContentOnMaster, expectedContentOnMaster);
});
