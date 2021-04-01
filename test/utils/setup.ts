import { basename, resolve } from '../../src/dependencies/path.ts';
import { executeProcessCriticalTask } from '../../src/lib/exec/executeProcessCriticalTask.ts';
import { executeProcessCriticalTasks } from '../../src/lib/exec/executeProcessCriticalTasks.ts';
import log from '../../src/dependencies/log.ts';

export async function initializeRepository (repositoryNamePrefix: string) {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: repositoryNamePrefix });
  Deno.chdir(testRepositoryPath);
  const tmpDir = resolve(testRepositoryPath, '..');

  await executeProcessCriticalTask([ 'git', 'init' ]);
  return { tmpDir, testRepositoryPath };
}

export async function deleteRepositories (tmpDir: string, ...testRepositoryPaths: string[]) {
  Deno.chdir(tmpDir); // Don't remove the current working repository, duh
  await testRepositoryPaths.reduce(
    (promise, testRepositoryPath) => promise.then(() => (
      Deno.remove(testRepositoryPath, { recursive: true })
    )),
    Promise.resolve(),
  );
}

export async function commitShit (testRepositoryPath: string, commitNumber: number) {
  await Deno.writeTextFile(resolve(testRepositoryPath, `commit_${commitNumber}.txt`), `commit ${commitNumber}`);
  const commitSubject = `Commit_#${commitNumber}`;
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', commitSubject ],
  ]);
  return commitSubject;
}

export async function initializeRemote (tmpDir: string, testRepositoryPath: string, originName: string) {
  Deno.chdir(tmpDir);
  const testRepositoryName: string = basename(testRepositoryPath);
  const newRepositoryName: string = `${testRepositoryName}_${originName}`;
  const newRepositoryPath = resolve(tmpDir, newRepositoryName);
  await executeProcessCriticalTask([ 'git', 'init', '--bare', newRepositoryName ]);
  Deno.chdir(testRepositoryPath);
  await executeProcessCriticalTasks([
    [ 'git', 'remote', 'add', originName, newRepositoryPath ],
    [ 'git', 'push', '--set-upstream', originName, 'master' ],
  ]);
  return newRepositoryPath;
}

export async function startTestLogs () {
  await log(Deno.stdout, '\n/=======================================\n');
}

export async function endTestLogs () {
  await log(Deno.stdout, '=======================================/\t');
}
