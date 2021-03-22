import { exec, OutputMode } from '../../dependencies/exec.ts';

export async function getTopLevel (): Promise<string> {
  const { output } = await exec('git rev-parse --show-toplevel', { output: OutputMode.Capture });
  return output;
}
