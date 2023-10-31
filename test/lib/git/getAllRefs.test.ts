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

import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';
import { getAllRefs } from '../../../src/lib/git/getAllRefs.ts';

Deno.test(stoyle`@int ${`${LOCATION}/getAllRefs`}`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getAllRefs');

  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'add', '.', '--all' ] },
    { command: 'git', args: [ 'commit', '--message', 'Mkay' ] },
  ]);

  const originRepositoryPath = await initializeRemote(repository, 'origin');
  await Deno.writeTextFile('anotherFile', 'whatever');
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'tag', 'da_tag' ] },
    { command: 'git', args: [ 'push', 'origin', 'da_tag' ] },

    { command: 'git', args: [ 'checkout', '-b', 'local-only' ] },
    { command: 'git', args: [ 'checkout', '-b', 'remote-only' ] },
    { command: 'git', args: [ 'add', '.', '--all' ] },
    { command: 'git', args: [ 'commit', '--message', 'Mkay_bis' ] },
    { command: 'git', args: [ 'push', '--set-upstream', 'origin', 'remote-only' ] },
    { command: 'git', args: [ 'checkout', 'master' ] },
    { command: 'git', args: [ 'branch', '--delete', 'remote-only' ] },
  ]);

  const allRefs = await getAllRefs();
  const onlyBranches = await getAllRefs('only');

  await deleteRepositories(repository, originRepositoryPath);

  assertEquals(allRefs, {
    branches: [ 'local-only', 'master', 'remote-only' ],
    tags: [ 'da_tag' ],
  });
  assertEquals(onlyBranches, {
    branches: [ 'local-only', 'remote-only' ],
    tags: [],
  });

  await endTestLogs();
});
