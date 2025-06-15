import { toFileUrl } from '../../dependencies/path.ts';

import { RepositoryMetadata } from './RepositoryMetadata.ts';
import { getTopLevel } from './getTopLevel.ts';

export async function getRepositoryMetadata(): RepositoryMetadata {
  const topLevel = await getTopLevel();
  const topLevelParts = toFileUrl(topLevel).toString().split('/');
  const repository = topLevelParts.pop();
  const owner = topLevelParts.pop();
  const server = topLevelParts.pop();

  return {
    server,
    owner,
    repository,
  };
}
