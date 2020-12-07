import { resolve } from '../../../src/dependencies/path.ts';
import { assertEquals } from '../../utils/assert.ts';
import { __, applyStyle, bold } from '../../../src/dependencies/colors.ts';
import { exec, execSequence, OutputMode } from '../../../src/dependencies/exec.ts';
import { initializeRepository, deleteRepositories, initializeRemote } from '../../utils/setup.ts';

import divisionsCommand from '../../../src/commands/simple/divisions.ts';

const command = 'gut divisions';
Deno.test(applyStyle(__`@int ${command} should show local branches`, [ bold ]), async () => {
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_divisions_local');

  await exec('git init', { output: OutputMode.None });
  await Deno.writeTextFile(resolve(testRepositoryPath, 'aFile'), 'whatever');
  await execSequence([
    'git add . -A',
    'git commit -m "Mkay"',
    'git checkout -b titi',
    'git checkout -b tata',
    'git checkout -b toto',
  ], { output: OutputMode.None });

  const { handler: divisions } = divisionsCommand;
  const output = await divisions({ isTestRun: true });

  await deleteRepositories(tmpDir, testRepositoryPath);

  assertEquals(output, `\
master
  tata
  titi
* toto`);
});

Deno.test(applyStyle(__`@int ${command} should show remote branches`, [ bold ]), async () => {
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_divisions_remote');
  await Deno.writeTextFile('aFile', 'whatever');
  await execSequence([
    'git add . -A',
    'git commit -m "Mkay"',
  ], { output: OutputMode.None });

  const originRepositoryPath = await initializeRemote(tmpDir, testRepositoryPath, 'origin');
  const upstreamRepositoryPath = await initializeRemote(tmpDir, testRepositoryPath, 'upstream');

  const { handler: divisions } = divisionsCommand;
  const outputO = await divisions({ remote: 'o', isTestRun: true });
  const outputOrigin = await divisions({ remote: 'origin', isTestRun: true });
  const outputU = await divisions({ remote: 'u', isTestRun: true });
  const outputUpstream = await divisions({ remote: 'upstream', isTestRun: true });

  await deleteRepositories(tmpDir, testRepositoryPath, originRepositoryPath, upstreamRepositoryPath);

  assertEquals(outputO, 'origin/master');
  assertEquals(outputOrigin, 'origin/master');
  assertEquals(outputU, 'upstream/master');
  assertEquals(outputUpstream, 'upstream/master');
});
