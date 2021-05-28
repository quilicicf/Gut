import { basename } from '../dependencies/path.ts';

import { getPermissionOrExit } from './getPermissionOrExit.ts';

export async function writeTextFile (filePath: string, data: string, options: { permissionPath?: string }) {
  const pathToAskAccessTo = options.permissionPath || basename(filePath);
  await getPermissionOrExit({ name: 'write', path: pathToAskAccessTo });
  return Deno.writeTextFile(filePath, data);
}
