import log from './dependencies/log.ts';
import { stoyleGlobal, theme } from './dependencies/stoyle.ts';

export const command = 'groot';
export const describe = 'Display a random sentence, in French';

export async function handler () {
  return log(Deno.stdout, stoyleGlobal`Je s'appelle Groot!\n`(theme.strong));
}
