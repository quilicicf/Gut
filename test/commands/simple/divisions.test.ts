import { resolve } from '../../../src/dependencies/path.ts';
import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { assertEquals } from '../../utils/assert.ts';
import {
  initializeRepository, deleteRepositories, initializeRemote, startTestLogs, endTestLogs,
} from '../../utils/setup.ts';

import { test } from '../../../src/commands/simple/divisions.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';
import { GIT_CURRENT_BRANCH_CODE, GIT_REMOTE_BRANCH_CODE, GIT_RESET_CODE } from '../../../src/lib/git/colorCodes.ts';

const { printDivisions } = test;
const command = 'gut divisions';
Deno.test(applyStyle(__`@int ${command} should show local branches`, [ theme.strong ]), async () => {
  await startTestLogs();
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_divisions_local');

  await Deno.writeTextFile(resolve(testRepositoryPath, 'aFile'), 'whatever');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', '"Mkay"' ],
    [ 'git', 'checkout', '-b', 'titi' ],
    [ 'git', 'checkout', '-b', 'tata' ],
    [ 'git', 'checkout', '-b', 'toto' ],
  ]);

  const output = await printDivisions(undefined);

  await deleteRepositories(tmpDir, testRepositoryPath);

  const expected = `\
  master${GIT_RESET_CODE}
  tata${GIT_RESET_CODE}
  titi${GIT_RESET_CODE}
* ${GIT_CURRENT_BRANCH_CODE}toto${GIT_RESET_CODE}\n`;
  assertEquals(output, expected);
  await endTestLogs();
});

Deno.test(applyStyle(__`@int ${command} should show remote branches`, [ theme.strong ]), async () => {
  await startTestLogs();
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_divisions_remote');
  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', '"Mkay"' ],
  ]);

  const originRepositoryPath = await initializeRemote(tmpDir, testRepositoryPath, 'origin');
  const upstreamRepositoryPath = await initializeRemote(tmpDir, testRepositoryPath, 'upstream');

  const outputO = await printDivisions('o');
  const outputOrigin = await printDivisions('origin');
  const outputU = await printDivisions('u');
  const outputUpstream = await printDivisions('upstream');

  await deleteRepositories(tmpDir, testRepositoryPath, originRepositoryPath, upstreamRepositoryPath);

  assertEquals(outputO, `  ${GIT_REMOTE_BRANCH_CODE}origin/master${GIT_RESET_CODE}\n`);
  assertEquals(outputOrigin, `  ${GIT_REMOTE_BRANCH_CODE}origin/master${GIT_RESET_CODE}\n`);
  assertEquals(outputU, `  ${GIT_REMOTE_BRANCH_CODE}upstream/master${GIT_RESET_CODE}\n`);
  assertEquals(outputUpstream, `  ${GIT_REMOTE_BRANCH_CODE}upstream/master${GIT_RESET_CODE}\n`);
  await endTestLogs();
});
