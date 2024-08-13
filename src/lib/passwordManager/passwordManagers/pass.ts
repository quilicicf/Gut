import { PasswordManager, PasswordManagerCreator } from '../passwordManager.ts';
import { executeAndGetStdout } from '../../exec/executeAndGetStdout.ts';
import log from '../../../dependencies/log.ts';
import { stoyleGlobal, theme } from '../../../dependencies/stoyle.ts';
import { executeProcessCriticalTask } from '../../exec/executeProcessCriticalTask.ts';

let password = null;

export function passCreator (toolName: string, accountName: string): PasswordManagerCreator {
  return {
    async readPassword (): Promise<string> {
      if (password) { return password; }

      const passwordId = `gut/${toolName}/${accountName}`;
      password = await executeAndGetStdout('pass', [ passwordId ], {});

      if (!password) {
        await log(Deno.stderr, stoyleGlobal`No password for ${passwordId}\n`(theme.warning));
        await executeProcessCriticalTask('pass', [ 'insert', passwordId ]);
        password = await executeAndGetStdout('pass', [ passwordId ], {});
      }

      return password;
    },
  } as PasswordManager;
}
