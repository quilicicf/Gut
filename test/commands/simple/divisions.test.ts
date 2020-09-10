import { resolve } from '../../../src/dependencies/path.ts';
import { assertEquals } from '../../utils/assert.ts';
import { bold } from '../../../src/dependencies/colors.ts';
import { exec, execSequence, OutputMode } from '../../../src/dependencies/exec.ts';

import divisionsCommand from '../../../src/commands/simple/divisions.ts';

Deno.test(`${bold('divisions')} local`, async () => {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: 'gut_test_divisions_local' });
  Deno.chdir(testRepositoryPath);
  const tmpDir = resolve(testRepositoryPath, '..');

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

  Deno.chdir(tmpDir); // Don't remove cwd, duh
  await Deno.remove(testRepositoryPath, { recursive: true });

  assertEquals(output, `\
master
  tata
  titi
* toto`);
});

const initiateRemote = async (tmpDir: string, testRepositoryPath: string, originName: string) => {
  Deno.chdir(tmpDir);
  const newRepositoryName: string = `gut_test_divisions_${originName}`;
  const newRepositoryPath = resolve(tmpDir, newRepositoryName);
  await exec(`git init --bare ${newRepositoryName}`, { output: OutputMode.None });
  Deno.chdir(testRepositoryPath);
  await execSequence([
    `git remote add ${originName} ${newRepositoryPath}`,
    `git push ${originName} master`,
  ], { output: OutputMode.None });
  return newRepositoryPath;
};

Deno.test(`${bold('divisions')} remote`, async () => {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: 'gut_test_divisions_remote' });
  const tmpDir = resolve(testRepositoryPath, '..');
  Deno.chdir(testRepositoryPath);
  await exec('git init', { output: OutputMode.None });
  await Deno.writeTextFile('aFile', 'whatever');
  await execSequence([
    'git add . -A',
    'git commit -m "Mkay"',
  ], { output: OutputMode.None });

  const originRepositoryPath = await initiateRemote(tmpDir, testRepositoryPath, 'origin');
  const upstreamRepositoryPath = await initiateRemote(tmpDir, testRepositoryPath, 'upstream');

  const { handler: divisions } = divisionsCommand;
  const outputO = await divisions({ remote: 'o', isTestRun: true });
  const outputOrigin = await divisions({ remote: 'origin', isTestRun: true });
  const outputU = await divisions({ remote: 'u', isTestRun: true });
  const outputUpstream = await divisions({ remote: 'upstream', isTestRun: true });

  Deno.chdir(tmpDir); // Don't remove cwd, duh
  await Deno.remove(testRepositoryPath, { recursive: true });
  await Deno.remove(originRepositoryPath, { recursive: true });
  await Deno.remove(upstreamRepositoryPath, { recursive: true });

  Deno.writeTextFileSync('/tmp/o', outputO);
  Deno.writeTextFileSync('/tmp/origin', outputOrigin);
  Deno.writeTextFileSync('/tmp/u', outputU);
  Deno.writeTextFileSync('/tmp/upstream', outputUpstream);

  assertEquals(outputO, 'origin/master');
  assertEquals(outputOrigin, 'origin/master');
  assertEquals(outputU, 'upstream/master');
  assertEquals(outputUpstream, 'upstream/master');
});
