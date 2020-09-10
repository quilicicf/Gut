import { bold } from '../../../src/dependencies/colors.ts';
import { resolve } from '../../../src/dependencies/path.ts';
import { exec, execSequence, OutputMode } from '../../../src/dependencies/exec.ts';

import { assertEquals } from '../../utils/assert.ts';
import pileCommand from '../../../src/commands/simple/pile.ts';

Deno.test(bold('pile'), async () => {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: 'gut_test_pile' });
  Deno.chdir(testRepositoryPath);
  const tmpDir = resolve(testRepositoryPath, '..');

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
  Deno.chdir(resolve(testRepositoryPath, 'nested'));

  const { handler: pile } = pileCommand;
  const output = await pile({ isTestRun: true });

  Deno.chdir(tmpDir); // Don't remove cwd, duh
  await Deno.remove(testRepositoryPath, { recursive: true });

  assertEquals(output, `\
## master
A  added
D  toRemove
A  updated`);
});
