import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import {
  deleteRepositories,
  endTestLogs,
  initializeRemote,
  initializeRepository,
  startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getBranchRemote } from '../../../src/lib/git/getBranchRemote.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';

Deno.test(stoyle`@int ${`${LOCATION}/getBranchRemote`}`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getBranchRemote');

  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'add', '.', '--all' ] },
    { command: 'git', args: [ 'commit', '--message', 'Mkay' ] },
  ]);

  const originRepositoryPath = await initializeRemote(repository, 'origin');

  await executeProcessCriticalTask('git', [ 'checkout', '-b', 'test-branch' ]);
  const remoteBeforePush = await getBranchRemote();

  await Deno.writeTextFile('anotherFile', 'whatever');
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'add', '.', '--all' ] },
    { command: 'git', args: [ 'commit', '--message', 'Mkay_bis' ] },
    { command: 'git', args: [ 'push', '--set-upstream', 'origin', 'test-branch' ] },
  ]);
  const remoteAfterPush = await getBranchRemote();

  await deleteRepositories(repository, originRepositoryPath);

  assertEquals(remoteBeforePush, undefined);
  assertEquals(remoteAfterPush, 'origin');

  await endTestLogs();
});
