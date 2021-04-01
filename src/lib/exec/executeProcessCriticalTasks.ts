import { ExecOptions } from './ExecOptions.ts';
import { executeProcessCriticalTask } from './executeProcessCriticalTask.ts';

export async function executeProcessCriticalTasks (commands: string[][], options: ExecOptions = {}) {
  await commands.reduce(
    (promise, command) => promise.then(() => executeProcessCriticalTask(command, options)),
    Promise.resolve(),
  );
}
