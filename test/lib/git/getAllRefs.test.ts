import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  deleteRepositories, endTestLogs, initializeRemote, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';
import { getAllRefs } from '../../../src/lib/git/getAllRefs.ts';

Deno.test(applyStyle(__`@int ${`${LOCATION}/getAllRefs`}`, [ theme.strong ]), async () => {
  await startTestLogs();
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_getAllRefs');

  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', 'Mkay' ],
  ]);

  const originRepositoryPath = await initializeRemote(tmpDir, testRepositoryPath, 'origin');
  await Deno.writeTextFile('anotherFile', 'whatever');
  await executeProcessCriticalTasks([
    [ 'git', 'tag', 'da_tag' ],
    [ 'git', 'push', 'origin', 'da_tag' ],

    [ 'git', 'checkout', '-b', 'local-only' ],
    [ 'git', 'checkout', '-b', 'remote-only' ],
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', 'Mkay_bis' ],
    [ 'git', 'push', '--set-upstream', 'origin', 'remote-only' ],
    [ 'git', 'checkout', 'master' ],
    [ 'git', 'branch', '--delete', 'remote-only' ],
  ]);

  const allRefs = await getAllRefs();

  await deleteRepositories(tmpDir, testRepositoryPath, originRepositoryPath);

  assertEquals(allRefs, {
    branches: [ 'local-only', 'master', 'remote-only' ],
    tags: [ 'da_tag' ],
  });

  await endTestLogs();
});
