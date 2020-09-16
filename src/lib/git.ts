import { _isEmpty } from '../dependencies/lodash.ts';
import { exec, OutputMode } from '../dependencies/exec.ts';
import { getParentBranch, parseBranchName, stringifyBranch } from './branch.ts';

interface LogFormat {postProcessor?: (wsv: string) => string}

export const WEIRD_SEPARATOR = '$%&'; // FIXME: would've used ✂✌🔪 => but Deno seems to struggle with multi-bytes characters in stdout
export const LOG_FORMATS: { [ key: string ]: LogFormat } = {
  pretty: {},
  simple: {},
  subject: {},
  json: {
    postProcessor (wsv: string) {
      const logObject = wsvToJson(wsv);
      return JSON.stringify(logObject);
    },
  },
  sha: {},
};

function wsvToJson (wsv: string): object[] {
  return wsv.split('\n')
    .map((wsvItem: string) => {
      const [ sha, message, author, branchesAsString ] = wsvItem.split(WEIRD_SEPARATOR);
      const branches = _isEmpty(branchesAsString) ? [] : branchesAsString.replace(/[()]/g, '').split(',');
      return { sha, message, author, branches };
    });
}

export async function getTopLevel (): Promise<string> {
  const { output } = await exec('git rev-parse --show-toplevel', { output: OutputMode.Capture });
  return output;
}

export async function moveUpTop (): Promise<void> {
  const topLevel = await getTopLevel();
  return Deno.chdir(topLevel);
}

export async function getCurrentBranchName (): Promise<string> {
  const { output: currentBranchName } = await exec('git rev-parse --abbrev-ref HEAD', { output: OutputMode.Capture });
  return currentBranchName;
}

async function getMergeBaseFromParent (): Promise<string> { // FIXME: can fail if branch is not parseable of has no parent
  const currentBranchName = await getCurrentBranchName();
  const currentBranch = parseBranchName(currentBranchName);
  const parentBranch = getParentBranch(currentBranch);
  const parentBranchName = stringifyBranch(parentBranch);
  const { output: mergeBase } = await exec(`git merge-base ${parentBranchName} ${currentBranchName}`, { output: OutputMode.Capture });
  return mergeBase;
}

export async function getCommitsNumberFromBaseBranch (): Promise<number> {
  const mergeBase = await getMergeBaseFromParent();
  const { output: commitsNumberAsString } = await exec(`git rev-list --count ${mergeBase}..HEAD`, { output: OutputMode.Capture });
  return parseInt(commitsNumberAsString);
}

export async function getCommitsFromBaseBranch (): Promise<object[]> {
  const mergeBase = await getMergeBaseFromParent();
  const { output: commitsAsWsv } = await exec(`git --no-pager gut-log-json ${mergeBase}..HEAD`, { output: OutputMode.Capture });
  return wsvToJson(commitsAsWsv);
}
