import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { assertEquals } from '../../utils/assert.ts';
import {
  commitShit, deleteRepositories, endTestLogs, initializeRemote, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';

import { handler as thrust } from '../../../src/commands/simple/thrust.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';
import { executeAndGetStdout } from '../../../src/lib/exec/executeAndGetStdout.ts';

const command = 'gut thrust';
const remoteName = 'origin';

Deno.test(applyStyle(__`@int ${command} should push to a branch`, [ theme.strong ]), async () => {
  await startTestLogs();
  const localRepositoryName = 'gut_test_thrust';
  const { tmpDir, testRepositoryPath } = await initializeRepository(localRepositoryName);
  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', 'Initialize_repository' ],
  ]);

  const originRepositoryPath = await initializeRemote(tmpDir, testRepositoryPath, remoteName);

  const commitSubject = await commitShit(testRepositoryPath, 1);
  await thrust({ force: false });

  await executeProcessCriticalTask([ 'git', 'checkout', 'origin/master' ]);
  const lastCommitSubject = await executeAndGetStdout([ 'git', 'log', '--max-count', '1', '--pretty=format:%s' ], true);

  await deleteRepositories(tmpDir, testRepositoryPath, originRepositoryPath);

  assertEquals(lastCommitSubject, commitSubject);
  await endTestLogs();
});

Deno.test(applyStyle(__`@int ${command} should force-push to a branch`, [ theme.strong ]), async () => {
  await startTestLogs();
  const localRepositoryName = 'gut_test_thrust_force';
  const { tmpDir, testRepositoryPath } = await initializeRepository(localRepositoryName);
  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', 'Initialize_repository' ],
  ]);

  const originRepositoryPath = await initializeRemote(tmpDir, testRepositoryPath, remoteName);

  const theFilePath = 'theFile';
  const commitSubject = 'Commit_that_will_be_redone';
  await Deno.writeTextFile(theFilePath, 'whatever, will be re-written');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', commitSubject ],
    [ 'git', 'push', '--set-upstream', remoteName, 'master' ], // Push it to remote
    [ 'git', 'reset', 'HEAD~1' ], // Undo it
  ]);

  const expectedCommitSubject = 'Commit_that_was_redone';
  const expectedContentOnMaster = 'Re-written value';
  await Deno.writeTextFile(theFilePath, expectedContentOnMaster);
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', expectedCommitSubject ],
  ]);

  await thrust({ force: true });

  await executeProcessCriticalTask([ 'git', 'checkout', 'origin/master' ]);
  const lastCommitSubject = await executeAndGetStdout([ 'git', 'log', '--max-count', '1', '--pretty=format:%s' ], true);
  const newContentOnMaster = await Deno.readTextFile(theFilePath);

  await deleteRepositories(tmpDir, testRepositoryPath, originRepositoryPath);

  assertEquals(lastCommitSubject, expectedCommitSubject);
  assertEquals(newContentOnMaster, expectedContentOnMaster);
  await endTestLogs();
});
