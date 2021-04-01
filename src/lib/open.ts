import { executeAndReturnStatus } from './exec/executeAndReturnStatus.ts';

const programAliases = {
  windows: 'explorer', // Does that work?
  darwin: 'open',
  linux: 'xdg-open',
};

export async function openInDefaultApplication (urlOrPath: string): Promise<boolean> {
  return executeAndReturnStatus([ programAliases[ Deno.build.os ], urlOrPath ]);
}
