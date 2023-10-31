import { executeAndReturnStatus } from './exec/executeAndReturnStatus.ts';
import { Executable } from '../configuration.ts';
import { stoyleGlobal, theme } from '../dependencies/stoyle.ts';

export async function openInBrowser (url: string, browser: Executable): Promise<boolean> {
  if (!browser || !Object.keys(browser).length) {
    throw Error(stoyleGlobal`Cannot open browser `(theme.error));
  }

  return executeAndReturnStatus(browser.command, [ ...browser.args, url ]);
}
