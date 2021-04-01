import { resolve } from '../../../src/dependencies/path.ts';
import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { assertEquals } from '../../utils/assert.ts';
import { handler as pile } from '../../../src/commands/simple/pile.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';
import { endTestLogs, startTestLogs } from '../../utils/setup.ts';

const command = 'gut pile';
Deno.test(applyStyle(__`@int ${command} should stage & add all changes in the repository`, [ theme.strong ]), async () => {
  await startTestLogs();
  const testRepositoryPath = await Deno.makeTempDir({ prefix: 'gut_test_pile' });
  Deno.chdir(testRepositoryPath);
  const tmpDir = resolve(testRepositoryPath, '..');

  await executeProcessCriticalTask([ 'git', 'init' ]);
  await Deno.mkdir(resolve(testRepositoryPath, 'nested'));
  await Deno.writeTextFile(resolve(testRepositoryPath, 'nested', 'witness'), 'witness');
  await Deno.writeTextFile(resolve(testRepositoryPath, 'toRemove'), 'toRemove');
  await Deno.writeTextFile(resolve(testRepositoryPath, 'toUpdate'), 'toUpdate');
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', 'Preparation_commit' ],
  ]);
  await Deno.writeTextFile(resolve(testRepositoryPath, 'updated'), 'toUpdate');
  await Deno.writeTextFile(resolve(testRepositoryPath, 'added'), 'added');
  await Deno.remove(resolve(testRepositoryPath, 'toRemove'));
  Deno.chdir(resolve(testRepositoryPath, 'nested'));

  const output = await pile();
  // eslint-disable-next-line no-control-regex
  const uncoloredOutput = output.replace(/\u001b\[.*?m/g, '');

  Deno.chdir(tmpDir); // Don't remove cwd, duh
  await Deno.remove(testRepositoryPath, { recursive: true });

  assertEquals(uncoloredOutput, `\
## master
A  added
D  toRemove
A  updated
`);
  await endTestLogs();
});
