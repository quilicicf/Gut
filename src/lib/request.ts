import { getPermissionOrExit } from './getPermissionOrExit.ts';

export async function request (url: string, init?: RequestInit): Promise<Response> {
  await getPermissionOrExit({ name: 'net', host: new URL(url).host });
  return fetch(url, init);
}
