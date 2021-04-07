import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

export async function getBranchRemote (): Promise<string | undefined> {
  try {
    const output = await executeAndGetStdout([
      'git', 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}',
    ], true);

    return output === ''
      ? undefined
      : output.split('/')[ 0 ];
  } catch (error) {
    return undefined;
  }
}
