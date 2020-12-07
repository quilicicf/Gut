import { resolve } from '../../src/dependencies/path.ts';
import { exec, execSequence, OutputMode } from '../../src/dependencies/exec.ts';

export async function initializeRepository (repositoryNamePrefix: string) {
  const testRepositoryPath = await Deno.makeTempDir({ prefix: repositoryNamePrefix });
  Deno.chdir(testRepositoryPath);
  const tmpDir = resolve(testRepositoryPath, '..');

  await exec('git init', { output: OutputMode.None });
  return { tmpDir, testRepositoryPath };
}

export async function deleteRepositories (tmpDir: string, ...testRepositoryPaths: string[]) {
  Deno.chdir(tmpDir); // Don't remove the current working repository, duh
  await testRepositoryPaths.reduce(
    (promise, testRepositoryPath) => promise.then(async () => {
      await Deno.remove(testRepositoryPath, { recursive: true });
    }),
    Promise.resolve(),
  );
}

export async function commitShit (testRepositoryPath: string, commitNumber: number) {
  await Deno.writeTextFile(resolve(testRepositoryPath, `commit_${commitNumber}.txt`), `commit ${commitNumber}`);
  await execSequence([ 'git add . -A', `git commit -m "Commit #${commitNumber}"` ], { output: OutputMode.None });
}

export async function initializeRemote (tmpDir: string, testRepositoryPath: string, originName: string) {
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
}
