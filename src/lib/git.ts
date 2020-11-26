import { _isEmpty } from '../dependencies/lodash.ts';
import { exec, OutputMode } from '../dependencies/exec.ts';
import { getParentBranch, parseBranchName, stringifyBranch } from './branch.ts';

export interface LogFormat {
  format: string,
  command: string,
  postProcessor?: (input: string) => string
}

export const LOG_FORMATS: { [ key: string ]: LogFormat } = {
  pretty: {
    format: `%C(red)%H%C(reset)\n\t%s %C(green)(%cr) %C(bold blue)<%an>%C(reset)\n\t%C(yellow)%d%C(reset)`,
    command: 'gut-log-pretty',
  },
  simple: {
    format: `%C(red)%h%C(reset) %s %C(bold blue)<%an>%C(reset)`,
    command: 'gut-log-simple',
  },
  subject: {
    format: `%s`,
    command: 'gut-log-subject',
  },
  sha: {
    format: `%H`,
    command: 'gut-log-sha',
  },
  json: {
    format: `%H|%s|%an|%D`,
    command: 'gut-log-json',
    postProcessor (psv: string) {
      const logObject = psvToJs(psv);
      return JSON.stringify(logObject);
    },
  },
};

function psvToJs (psv: string): object[] {
  return psv.split('\n')
    .map((psvItem: string) => {
      const [ sha, message, author, branchesAsString ] = psvItem.split('|');
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
  const logCommand = LOG_FORMATS.json.command;
  const { output: commitsAsWsv } = await exec(`git --no-pager ${logCommand} ${mergeBase}..HEAD`, { output: OutputMode.Capture });
  return psvToJs(commitsAsWsv);
}
