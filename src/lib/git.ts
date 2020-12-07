import { _isEmpty } from '../dependencies/lodash.ts';
import { exec, OutputMode } from '../dependencies/exec.ts';
import { getParentBranch, parseBranchName, stringifyBranch } from './branch.ts';
import {
  __, applyStyle, theme,
} from '../dependencies/colors.ts';

export interface Commit {
  sha: string,
  subject: string,
  author: string,
  relativeDate: string,
  branches: string[]
}

export type LogFormat = (commits: Commit[]) => string

export const LOG_FORMATS: { [ key: string ]: LogFormat } = {
  JSON: (commits: Commit[]): string => `${JSON.stringify(commits)}\n`,
  SHA: (commits: Commit[]): string => `${commits.map(({ sha }) => sha).join('\n')}\n`,
  SUBJECT: (commits: Commit[]): string => `${commits.map(({ subject }) => subject).join('\n')}\n`,
  SIMPLE: (commits: Commit[]): string => commits
    .map((commit: Commit) => applyStyle(
      __`${commit.sha.substr(0, 7)} ${commit.subject} ${`<${commit.author}>`}\n`,
      [ theme.sha, null, theme.author ],
    ))
    .join(''),
  PRETTY: (commits: Commit[]): string => commits
    .map((commit: Commit) => applyStyle(
      __`${commit.sha}\n\t${commit.subject} ${`(${commit.relativeDate})`} ${`<${commit.author}>`}\n\t${`(${commit.branches.join(', ')})`}\n`,
      [ theme.sha, null, theme.relativeDate, theme.author, theme.branches ],
    ))
    .join(''),
};

const PSV_FORMAT_ARGUMENT = '--pretty=format:%H|%s|%an|%cr|%D';

export function psvToJs (psv: string): Commit[] {
  return psv.split('\n')
    .map((psvItem: string) => {
      const [ sha, subject, author, relativeDate, branchesAsString ] = psvItem.split('|');
      const branches = _isEmpty(branchesAsString) ? [] : branchesAsString.replace(/[()]/g, '').split(',');
      return {
        sha, subject, author, relativeDate, branches,
      };
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

async function getMergeBaseFromParent (): Promise<string> { // FIXME: can fail if branch is not parsable or is orphan
  const currentBranchName = await getCurrentBranchName();
  const currentBranch = parseBranchName(currentBranchName);
  const parentBranch = getParentBranch(currentBranch);
  const parentBranchName = stringifyBranch(parentBranch);
  const { output: mergeBase } = await exec(`git merge-base ${parentBranchName} ${currentBranchName}`, { output: OutputMode.Capture });
  return mergeBase;
}

export async function getCommitsBetweenRefs (
  baseRef: string,
  targetRef: string,
  shouldReverse: boolean,
): Promise<Commit[]> {

  const reverseArgument = shouldReverse ? '--reverse' : '';
  const { output: commitsAsPsv } = await exec(
    `git --no-pager log ${PSV_FORMAT_ARGUMENT} --color=never ${reverseArgument} ${baseRef}..${targetRef}`,
    { output: OutputMode.Capture },
  );
  return psvToJs(commitsAsPsv);
}

export async function getCommitsUpToMax (maxCommits: number, shouldReverse: boolean): Promise<Commit[]> {
  const reverseArgument = shouldReverse ? '--reverse' : '';
  const { output: commitsAsPsv } = await exec(
    `git --no-pager log ${PSV_FORMAT_ARGUMENT} --color=never --max-count ${maxCommits} ${reverseArgument}`,
    { output: OutputMode.Capture },
  );
  return psvToJs(commitsAsPsv);
}

export async function getCommitsFromBaseBranch (shouldReverse: boolean): Promise<Commit[]> {
  const mergeBase = await getMergeBaseFromParent();
  return getCommitsBetweenRefs(mergeBase, 'HEAD', shouldReverse);
}
