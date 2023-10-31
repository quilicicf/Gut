import { ExecOptions } from './ExecOptions.ts';
import { executeProcessCriticalTask } from './executeProcessCriticalTask.ts';
import { Executable } from '../../configuration.ts';

export async function executeProcessCriticalTasks (commands: Executable[], options: ExecOptions = {}) {
  await commands.reduce(
    (promise, executable) => promise.then(
      () => executeProcessCriticalTask(executable.command, executable.args, options),
    ),
    Promise.resolve(),
  );
}
