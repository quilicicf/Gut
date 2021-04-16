import { basename } from '../../dependencies/path.ts';

import { getTopLevel } from './getTopLevel.ts';

export async function getRepositoryNameFromPath () {
  const topLevel = await getTopLevel();
  return basename(topLevel);
}
