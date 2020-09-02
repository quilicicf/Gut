import { exec, OutputMode } from 'https://deno.land/x/exec/mod.ts';

export async function getTopLevel (): Promise<string> {
  const { output } = await exec('git rev-parse --show-toplevel', { output: OutputMode.Capture });
  return output;
}

export async function moveUpTop (): Promise<void> {
  const topLevel = await getTopLevel();
  return Deno.chdir(topLevel);
}
