import { resolve } from '../../../src/dependencies/path.ts';
import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { assertEquals } from '../../utils/assert.ts';
import { handler as pile } from '../../../src/commands/simple/pile.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';
import { deleteRepositories, endTestLogs, initializeRepository, startTestLogs } from '../../utils/setup.ts';

const command = 'gut pile';
Deno.test(stoyle`@int ${command} should stage & add all changes in the repository`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_pile');

  await executeProcessCriticalTask('git', [ 'init' ]);
  await Deno.mkdir('nested');
  await Deno.writeTextFile(resolve('nested', 'witness'), 'witness');
  await Deno.writeTextFile('toRemove', 'toRemove');
  await Deno.writeTextFile('toUpdate', 'toUpdate');
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'add', '.', '--all' ] },
    { command: 'git', args: [ 'commit', '--message', 'Preparation_commit' ] },
  ]);

  await Deno.writeTextFile('updated', 'toUpdate');
  await Deno.writeTextFile('added', 'added');
  await Deno.remove('toRemove');
  Deno.chdir('nested');

  const output = await pile();
  // eslint-disable-next-line no-control-regex
  const uncoloredOutput = output.replace(/\u001b\[.*?m/g, '');

  await deleteRepositories(repository);

  assertEquals(uncoloredOutput, `\
## master
A  added
D  toRemove
A  updated
`);
  await endTestLogs();
});
