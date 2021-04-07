import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  deleteRepositories, endTestLogs, initializeRemote, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getBranchRemote } from '../../../src/lib/git/getBranchRemote.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';

Deno.test(applyStyle(__`@int ${`${LOCATION}/getBranchRemote`}`, [ theme.strong ]), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getBranchRemote');

  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', 'Mkay' ],
  ]);

  const originRepositoryPath = await initializeRemote(repository, 'origin');

  await executeProcessCriticalTask([ 'git', 'checkout', '-b', 'test-branch' ]);
  const remoteBeforePush = await getBranchRemote();

  await Deno.writeTextFile('anotherFile', 'whatever');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', 'Mkay_bis' ],
    [ 'git', 'push', '--set-upstream', 'origin', 'test-branch' ],
  ]);
  const remoteAfterPush = await getBranchRemote();

  await deleteRepositories(repository, originRepositoryPath);

  assertEquals(remoteBeforePush, undefined);
  assertEquals(remoteAfterPush, 'origin');

  await endTestLogs();
});
