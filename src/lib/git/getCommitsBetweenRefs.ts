import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

import { Commit } from './Commit.ts';
import { asvToJs } from './asvToJs.ts';
import { ASV_FORMAT_ARGUMENT } from './logFormats.ts';

export async function getCommitsBetweenRefs (
  baseRef: string,
  targetRef: string,
  shouldReverse: boolean,
): Promise<Commit[]> {

  const reverseArgument = shouldReverse ? [ '--reverse' ] : [];
  const commitsAsAsv = await executeAndGetStdout(
    'git',
    [ '--no-pager', 'log', ASV_FORMAT_ARGUMENT, '--color=never', ...reverseArgument, `${baseRef}..${targetRef}` ],
    {},
  );
  return asvToJs(commitsAsAsv);
}
