import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { assertEquals } from '../../utils/assert.ts';
import {
  deleteRepositories,
  endTestLogs,
  initializeRemote,
  initializeRepository,
  startTestLogs,
} from '../../utils/setup.ts';

import { test } from '../../../src/commands/simple/divisions.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';
import { GIT_CURRENT_BRANCH_CODE, GIT_REMOTE_BRANCH_CODE, GIT_RESET_CODE } from '../../../src/lib/git/colorCodes.ts';

const { printDivisions } = test;
const command = 'gut divisions';
Deno.test(stoyle`@int ${command} should show local branches`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_divisions_local');

  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'add', '.', '--all' ] },
    { command: 'git', args: [ 'commit', '--message', '"Mkay"' ] },
    { command: 'git', args: [ 'checkout', '-b', 'titi' ] },
    { command: 'git', args: [ 'checkout', '-b', 'tata' ] },
    { command: 'git', args: [ 'checkout', '-b', 'toto' ] },
  ]);

  const output = await printDivisions();

  await deleteRepositories(repository);

  const expected = `\
  master${GIT_RESET_CODE}
  tata${GIT_RESET_CODE}
  titi${GIT_RESET_CODE}
* ${GIT_CURRENT_BRANCH_CODE}toto${GIT_RESET_CODE}\n`;
  assertEquals(output, expected);
  await endTestLogs();
});

Deno.test(stoyle`@int ${command} should show remote branches`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_divisions_remote');
  await Deno.writeTextFile('aFile', 'whatever');
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'add', '.', '--all' ] },
    { command: 'git', args: [ 'commit', '--message', '"Mkay"' ] },
  ]);

  const originRepository = await initializeRemote(repository, 'origin');
  const upstreamRepository = await initializeRemote(repository, 'upstream');

  const outputO = await printDivisions('o');
  const outputOrigin = await printDivisions('origin');
  const outputU = await printDivisions('u');
  const outputUpstream = await printDivisions('upstream');

  await deleteRepositories(repository, originRepository, upstreamRepository);

  assertEquals(outputO, `  ${GIT_REMOTE_BRANCH_CODE}origin/master${GIT_RESET_CODE}\n`);
  assertEquals(outputOrigin, `  ${GIT_REMOTE_BRANCH_CODE}origin/master${GIT_RESET_CODE}\n`);
  assertEquals(outputU, `  ${GIT_REMOTE_BRANCH_CODE}upstream/master${GIT_RESET_CODE}\n`);
  assertEquals(outputUpstream, `  ${GIT_REMOTE_BRANCH_CODE}upstream/master${GIT_RESET_CODE}\n`);
  await endTestLogs();
});
