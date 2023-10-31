import { basename, resolve } from '../../src/dependencies/path.ts';
import { executeProcessCriticalTask } from '../../src/lib/exec/executeProcessCriticalTask.ts';
import { executeProcessCriticalTasks } from '../../src/lib/exec/executeProcessCriticalTasks.ts';
import log from '../../src/dependencies/log.ts';

export interface TestRepository {
  tmpDir: string;
  path: string;
  name: string;
}

export async function initializeRepository (repositoryNamePrefix: string): Promise<TestRepository> {
  const path = await Deno.makeTempDir({ prefix: repositoryNamePrefix });
  const name = basename(path);
  Deno.chdir(path);
  const tmpDir = resolve(path, '..');

  await executeProcessCriticalTask('git', [ 'init' ]);
  await executeProcessCriticalTask('git', [ 'config', 'core.hooksPath', 'no-hooks' ]);
  await executeProcessCriticalTask('git', [ 'config', '--local', 'commit.gpgSign', 'false' ]);
  return { tmpDir, path, name };
}

export async function deleteRepositories (...testRepositoryPaths: TestRepository[]) {
  const { tmpDir } = testRepositoryPaths[ 0 ];
  Deno.chdir(tmpDir); // Don't remove the current working repository, duh
  await testRepositoryPaths.reduce(
    (promise, { path }) => promise.then(() => (
      Deno.remove(path, { recursive: true })
    )),
    Promise.resolve(),
  );
}

export interface ShitCommit {
  subject: string;
  fileName: string;
  filePath: string;
  fileContent: string;
}

export async function commitShit (repository: TestRepository, commitNumber: number): Promise<ShitCommit> {
  const fileName = `commit_${commitNumber}.txt`;
  const filePath = resolve(repository.path, fileName);
  const fileContent = `commit ${commitNumber}\n`;
  await Deno.writeTextFile(filePath, fileContent);
  const subject = `Commit_#${commitNumber}`;
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'add', '.', '--all' ] },
    { command: 'git', args: [ 'commit', '--message', subject ] },
  ]);
  return {
    subject,
    fileName,
    filePath,
    fileContent,
  };
}

export async function initializeRemote (testRepository: TestRepository, originName: string): Promise<TestRepository> {
  Deno.chdir(testRepository.tmpDir);
  const name: string = `${testRepository.name}_${originName}`;
  const path = resolve(testRepository.tmpDir, name);
  await executeProcessCriticalTask('git', [ 'init', '--bare', name ]);
  Deno.chdir(testRepository.path);
  await executeProcessCriticalTasks([
    { command: 'git', args: [ 'remote', 'add', originName, path ] },
    { command: 'git', args: [ 'push', '--set-upstream', originName, 'master' ] },
  ]);
  return { tmpDir: testRepository.tmpDir, path, name };
}

export async function startTestLogs () {
  await log(Deno.stdout, '\n/=======================================\n');
}

export async function endTestLogs () {
  await log(Deno.stdout, '=======================================/\t');
}
