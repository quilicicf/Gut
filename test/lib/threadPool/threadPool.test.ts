import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { assert, assertEquals } from '../../utils/assert.ts';
import { LOCATION } from './threadPool.utils.ts';

import { createWorker, threadPoolExec } from '../../../src/lib/threadPool.ts';
import { Payload } from './delayedWorker.ts';

Deno.test(stoyle`@unit ${`${LOCATION}`} should create worker and run it`({ nodes: [ theme.strong ] }), async () => {
  const worker = createWorker(new URL('./delayedWorker.ts', import.meta.url).href, 'test-worker');

  const payload: Payload<{ message: string }> = { delay: 5, result: { message: 'mkay' } };
  const result = await new Promise((resolve) => {
    worker.onmessage = (event: MessageEvent<{ result: string }>) => resolve(event.data);
    worker.postMessage(payload);
  });
  worker.terminate();

  assertEquals(result, payload.result);
});

Deno.test(stoyle`@unit ${`${LOCATION}`} should return the results of tasks`({ nodes: [ theme.strong ] }), async () => {
  const workerCreator = () => createWorker(new URL('./delayedWorker.ts', import.meta.url).href);
  const delayInMs = 40;
  const title = `Wait for ${delayInMs}ms`;
  const result = { message: 'whatever' };
  const errorMessage = 'whatever';
  const tasks = [
    { title, delayInMs, result },
    { title, delayInMs, result },
    { title, delayInMs, errorMessage },
  ];

  const { results, errors } = await threadPoolExec(workerCreator, tasks);

  assertEquals(results.length, 2);
  assertEquals(errors.length, 1);
});

Deno.test(stoyle`@unit ${`${LOCATION}`} should run tasks in parallel`({ nodes: [ theme.strong ] }), async () => {
  const workerCreator = () => createWorker(new URL('./delayedWorker.ts', import.meta.url).href);
  const delayInMs = 40;
  const title = `Wait for ${delayInMs}ms`;
  const result = { message: 'whatever' };
  const tasks = [
    { title, delayInMs, result },
    { title, delayInMs, result },
    { title, delayInMs, result },
  ];

  const start = new Date().getTime();
  await threadPoolExec(workerCreator, tasks);
  const end = new Date().getTime();
  const elapsed = end - start;

  assert(elapsed < (tasks.length * delayInMs));
});
