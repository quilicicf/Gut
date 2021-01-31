import { exec, OutputMode } from '../dependencies/exec.ts';

export async function editFile (editor: string, filePath: string) {
  await exec(`${editor} ${filePath}`, { output: OutputMode.None });
}
