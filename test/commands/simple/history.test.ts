import { bold } from '../../../src/dependencies/colors.ts';
import { resolve } from '../../../src/dependencies/path.ts';
import { exec, execSequence, OutputMode } from '../../../src/dependencies/exec.ts';

import { assertEquals, assertMatch } from '../../utils/assert.ts';
import historyCommand from '../../../src/commands/simple/history.ts';

const commitShit = async (testRepositoryPath: string, commitNumber: number) => {
  await Deno.writeTextFile(resolve(testRepositoryPath, `commit_${commitNumber}.txt`), `commit ${commitNumber}`);
  await execSequence([ 'git add . -A', `git commit -m "Commit #${commitNumber}"` ], { output: OutputMode.None });
};

Deno.test(`command ${bold('history')} formats`, async () => {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: 'gut_test_history_formats' });
  Deno.chdir(testRepositoryPath);
  const tmpDir = resolve(testRepositoryPath, '..');

  await exec('git init', { output: OutputMode.None });
  await commitShit(testRepositoryPath, 1);

  const { handler: history } = historyCommand;
  const outputPretty = await history({ isTestRun: true, format: 'pretty' });
  const outputSimple = await history({ isTestRun: true, format: 'simple' });
  const outputSubject = await history({ isTestRun: true, format: 'subject' });
  const outputJson = await history({ isTestRun: true, format: 'json' });
  const outputSha = await history({ isTestRun: true, format: 'sha' });

  Deno.chdir(tmpDir); // Don't remove cwd, duh
  await Deno.remove(testRepositoryPath, { recursive: true });

  assertMatch(
    outputPretty,
    /^\[31m[a-z0-9]{40}\[m\n\tCommit #1 \[32m\([0-9]+ second(s)? ago\) \[1;34m<[^>]+>\[m\n\t\[33m \(HEAD -> master\)\[m$/,
  );
  assertMatch(outputSimple, /^\[31m[a-z0-9]{7}\[m Commit #1 \[1;34m<[^>]+>\[m$/);
  assertMatch(outputSubject, /^Commit #1$/);
  assertMatch(outputJson, /^\[{"sha":"[a-z0-9]{40}","message":"Commit #1","author":"[^"]+","branches":\["HEAD -> master"]}]$/);
  assertMatch(outputSha, /^[a-z0-9]{40}$/);
});

Deno.test(`command ${bold('history')} skip & number`, async () => {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: 'gut_test_history_skip_number' });
  Deno.chdir(testRepositoryPath);
  const tmpDir = resolve(testRepositoryPath, '..');

  await exec('git init', { output: OutputMode.None });
  await commitShit(testRepositoryPath, 1);
  await commitShit(testRepositoryPath, 2);
  await commitShit(testRepositoryPath, 3);
  await commitShit(testRepositoryPath, 4);
  await commitShit(testRepositoryPath, 5);

  const { handler: history } = historyCommand;
  const output = await history({ isTestRun: true, format: 'subject', skip: 2, number: 2 });

  Deno.chdir(tmpDir); // Don't remove cwd, duh
  await Deno.remove(testRepositoryPath, { recursive: true });

  assertEquals(output, 'Commit #3\nCommit #2');
});

Deno.test(`command ${bold('history')} reverse`, async () => {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: 'gut_test_history_reverse' });
  Deno.chdir(testRepositoryPath);
  const tmpDir = resolve(testRepositoryPath, '..');

  await exec('git init', { output: OutputMode.None });
  await commitShit(testRepositoryPath, 1);
  await commitShit(testRepositoryPath, 2);

  const { handler: history } = historyCommand;
  const output = await history({ isTestRun: true, format: 'subject', reverse: true });

  Deno.chdir(tmpDir); // Don't remove cwd, duh
  await Deno.remove(testRepositoryPath, { recursive: true });

  assertEquals(output, 'Commit #1\nCommit #2');
});

Deno.test(`command ${bold('history')} from base branch`, async () => {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: 'gut_test_history_fromBaseBranch' });
  Deno.chdir(testRepositoryPath);
  const tmpDir = resolve(testRepositoryPath, '..');

  await exec('git init', { output: OutputMode.None });
  await commitShit(testRepositoryPath, 1);
  await exec('git checkout -b master__anotherBranch', { output: OutputMode.None });
  await commitShit(testRepositoryPath, 2);

  const { handler: history } = historyCommand;
  const output = await history({ isTestRun: true, format: 'subject', fromBaseBranch: true });

  Deno.chdir(tmpDir); // Don't remove cwd, duh
  await Deno.remove(testRepositoryPath, { recursive: true });

  assertEquals(output, 'Commit #2');
});
