import log from '../dependencies/log.ts';
import { stoyle, theme } from '../dependencies/stoyle.ts';

const getThreadsNumber = (cpusNumber: number, tasksNumber: number): number => {
  if (cpusNumber === 1) { return 1; }
  return cpusNumber > tasksNumber ? tasksNumber : cpusNumber - 1; // Leave some processing power for the user
};

export interface WorkerInputMessage {
  title: string;
}

type WorkerPool = {
  tasksNumber: number,
  tasks: WorkerInputMessage[],
  results: any[],
  errors: Error[],
  workers: Worker[],
}

async function runTask<T> (workerPool: WorkerPool): Promise<void> {
  const worker = workerPool.workers.pop();
  if (!worker) { throw Error('Missing worker, this should not happen, please contact the developer'); }

  const task = workerPool.tasks.pop();
  if (!task) { // No more tasks to do, time to stop working
    worker.terminate();
    return;
  }

  return new Promise((resolve) => {
    worker.onmessage = async (outputMessage: MessageEvent) => {
      workerPool.results.push(outputMessage.data);
      workerPool.workers.push(worker);
      const taskIndexBaseOne = workerPool.results.length + workerPool.errors.length;
      await log(Deno.stdout, stoyle`[${taskIndexBaseOne}/${workerPool.tasksNumber}] ${task.title} ✔\n`(
        {
          edges: [ undefined, undefined, undefined, theme.success ],
          nodes: [ theme.taskProgression, theme.taskProgression, theme.strong ],
        },
      ));
      await runTask(workerPool);
      resolve();
    };

    const onError = async (error: any) => {
      console.log('ERROR!');
      workerPool.errors.push(error);
      workerPool.workers.push(worker);
      const taskIndexBaseOne = workerPool.results.length + workerPool.errors.length;
      await log(Deno.stdout, stoyle`[${taskIndexBaseOne}/${workerPool.tasksNumber}] ${task.title} ✖\n`(
        {
          edges: [ undefined, undefined, undefined, theme.error ],
          nodes: [ theme.taskProgression, theme.taskProgression, theme.strong ],
        },
      ));
      await runTask(workerPool);
      resolve();
    };
    worker.onerror = async ({ error }: ErrorEvent) => onError(error);
    worker.onmessageerror = async ({ data: error }: MessageEvent) => onError(error);
    worker.postMessage(task);
  });
}

export interface WorkerPoolResults {
  results: any[];
  errors: Error[];
}

const WORKER_OPTIONS: WorkerOptions = {
  type: 'module',
  // @ts-ignore
  deno: { namespace: true },
};

export function createWorker (path: string, name?: string) {
  return new Worker(path, { ...WORKER_OPTIONS, name });
}

export async function threadPoolExec (workerCreator: () => Worker, tasks: WorkerInputMessage[]): Promise<WorkerPoolResults> {
  // @ts-ignore
  const { op_system_cpu_info: cpuNumberOpCall } = Deno.core.ops();
  // @ts-ignore
  const { cores: cpusNumber } = Deno.core.opcall(cpuNumberOpCall);

  const tasksNumber = tasks.length;
  const threadsNumber = getThreadsNumber(cpusNumber, tasksNumber);
  const workers = Array(threadsNumber).fill(null).map(() => workerCreator());
  const workerPool: WorkerPool = {
    tasksNumber,
    tasks: [ ...tasks ], // Prevents mutating parameter
    results: [],
    errors: [],
    workers,
  };

  const taskPromises = Array(threadsNumber)
    .fill(null)
    .map((_, index) => runTask(workerPool));

  await Promise.all(taskPromises);
  return {
    results: workerPool.results,
    errors: workerPool.errors,
  };
}
