import { basename } from '../dependencies/path.ts';

import { getPermissionOrExit } from './getPermissionOrExit.ts';

export async function readTextFile (filePath: string, options: { permissionPath?: string }) {
  const pathToAskAccessTo = options.permissionPath || basename(filePath);
  await getPermissionOrExit({ name: 'read', path: pathToAskAccessTo });
  return Deno.readTextFile(filePath);
}
