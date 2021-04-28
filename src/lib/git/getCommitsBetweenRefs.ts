import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

import { Commit } from './Commit.ts';
import { psvToJs } from './psvToJs.ts';
import { PSV_FORMAT_ARGUMENT } from './logFormats.ts';

export async function getCommitsBetweenRefs (
  baseRef: string,
  targetRef: string,
  shouldReverse: boolean,
): Promise<Commit[]> {

  const reverseArgument = shouldReverse ? [ '--reverse' ] : [];
  const commitsAsPsv = await executeAndGetStdout(
    [ 'git', '--no-pager', 'log', PSV_FORMAT_ARGUMENT, '--color=never', ...reverseArgument, `${baseRef}..${targetRef}` ],
    {},
  );
  return psvToJs(commitsAsPsv);
}
