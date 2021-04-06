import { getTopLevel } from './getTopLevel.ts';

export async function moveUpTop (): Promise<void> {
  const topLevel = await getTopLevel();
  return Deno.chdir(topLevel);
}
