import { assertEquals } from '../../utils/assert.ts';
import { resolve } from '../../../src/utils/path.ts';
import { exec, execSequence, OutputMode } from '../../../src/utils/exec.ts';

import pileCommand from '../../../src/commands/simple/pile.ts';

Deno.test('pile', async () => {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: 'gut_test_pile' });
  await Deno.chdir(testRepositoryPath);
  await exec('git init', { output: OutputMode.None });
  await Deno.mkdir(resolve(testRepositoryPath, 'nested'));
  await Deno.writeTextFile(resolve(testRepositoryPath, 'nested', 'witness'), 'witness');
  await Deno.writeTextFile(resolve(testRepositoryPath, 'toRemove'), 'toRemove');
  await Deno.writeTextFile(resolve(testRepositoryPath, 'toUpdate'), 'toUpdate');
  await execSequence([
    'git add . -A',
    'git commit -m "Preparation commit"',
  ], { output: OutputMode.None });
  await Deno.writeTextFile(resolve(testRepositoryPath, 'updated'), 'toUpdate');
  await Deno.writeTextFile(resolve(testRepositoryPath, 'added'), 'added');
  await Deno.remove(resolve(testRepositoryPath, 'toRemove'));
  await Deno.chdir(resolve(testRepositoryPath, 'nested'));

  const { handler: pile } = pileCommand;
  const output = await pile({ isTestRun: true });

  await Deno.remove(testRepositoryPath, { recursive: true });

  assertEquals(output, `\
[33m## [m[32mmaster[m
[32mA[m  added
[32mD[m  toRemove
[32mA[m  updated`);
});
