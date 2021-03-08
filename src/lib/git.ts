import { isEmpty } from '../dependencies/ramda.ts';
import { exec, OutputMode } from '../dependencies/exec.ts';
import { __, applyStyle, theme } from '../dependencies/colors.ts';

import { getTopLevel } from './git/getTopLevel.ts';

import {
  Branch, getParentBranch, parseBranchName, stringifyBranch,
} from './branch.ts';

export interface Commit {
  sha: string,
  subject: string,
  author: string,
  relativeDate: string,
  branches: string[]
}

export type LogFormat = (commits: Commit[]) => string

export const GIT_RESET_CODE = '\x1b[m';
export const GIT_CURRENT_BRANCH_CODE = '\x1b[32m';
export const GIT_REMOTE_BRANCH_CODE = '\x1b[31m';

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
    .filter(Boolean)
    .map((psvItem: string) => {
      const [ sha, subject, author, relativeDate, branchesAsString ] = psvItem.split('|');
      const branches = isEmpty(branchesAsString) ? [] : branchesAsString.replace(/[()]/g, '').split(',');
      return {
        sha, subject, author, relativeDate, branches,
      };
    });
}

export async function moveUpTop (): Promise<void> {
  const topLevel = await getTopLevel();
  return Deno.chdir(topLevel);
}

export async function getCurrentBranchName (): Promise<string> {
  const { output: currentBranchName } = await exec('git rev-parse --abbrev-ref HEAD', { output: OutputMode.Capture });
  return currentBranchName;
}

export async function getCurrentBranch (): Promise<Branch> {
  const currentBranchName = await getCurrentBranchName();
  return parseBranchName(currentBranchName);
}

async function getMergeBaseFromParent (): Promise<string> { // FIXME: can fail if branch is not parsable or is orphan
  const currentBranchName = await getCurrentBranchName();
  const currentBranch = parseBranchName(currentBranchName);
  const parentBranch = getParentBranch(currentBranch);
  const parentBranchName = stringifyBranch(parentBranch);
  const { output: mergeBase } = await exec(`git merge-base ${parentBranchName} ${currentBranchName}`, { output: OutputMode.Capture });
  return mergeBase;
}

export async function getDiffBetweenRefs (baseRef: string, targetRef: string): Promise<string> {
  const { output: diff } = await exec(
    `git --no-pager diff -U0 --no-color ${baseRef}..${targetRef}`,
    { output: OutputMode.Capture },
  );
  return diff;
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

export async function getCommitsFromParentBranch (shouldReverse: boolean): Promise<Commit[]> {
  const mergeBase = await getMergeBaseFromParent();
  return getCommitsBetweenRefs(mergeBase, 'HEAD', shouldReverse);
}

export async function getRemotes (): Promise<string[]> {
  const { output } = await exec('git remote show', { output: OutputMode.Capture });
  return output.split(/\s/);
}

interface RefType {
  regex: RegExp,
  detect: (ref: string) => boolean,
  extractName: (ref: string) => string,
}

const REF_TYPES: { [ key: string ]: RefType } = {
  TAG: {
    regex: /^refs\/tags\/(.*)/,
    detect (ref: string) { return this.regex.test(ref); },
    extractName (ref: string) {
      // @ts-ignore
      return this.regex.exec(ref)[ 1 ];
    },
  },
  STASH: {
    regex: /^refs\/stash$/,
    detect (ref: string) { return this.regex.test(ref); },
    extractName (): string {
      throw Error('Can\'t extract ref name on stash ref.');
    },
  },
  HEADS: {
    regex: /^refs\/heads\/(.*)/,
    detect (ref: string) { return this.regex.test(ref); },
    extractName (ref: string) {
      // @ts-ignore
      return this.regex.exec(ref)[ 1 ];
    },
  },
  REMOTE: {
    regex: /^refs\/remotes\/([^/]+)\/(.*)/,
    detect (ref: string) { return this.regex.test(ref); },
    extractName (ref: string) {
      // @ts-ignore
      return this.regex.exec(ref)[ 2 ];
    },
  },
};

type Refs = {
  branches: string[],
  tags: string[],
}

export async function getAllRefs (filterText: string = ''): Promise<Refs> {
  const { output: allRefsAsString } = await exec('git show-ref', { output: OutputMode.Capture });

  const accumulator: Refs = { branches: [], tags: [] };
  const { branches, tags } = allRefsAsString
    .split('\n')
    .map((refAsString) => refAsString.split(' ')[ 1 ])
    .filter((refName) => !REF_TYPES.STASH.detect(refName))
    .reduce(
      (seed, ref) => {
        if (REF_TYPES.HEADS.detect(ref)) {
          seed.branches.push(REF_TYPES.HEADS.extractName(ref));
          return seed;
        }

        if (REF_TYPES.REMOTE.detect(ref)) {
          seed.branches.push(REF_TYPES.REMOTE.extractName(ref));
          return seed;
        }

        if (REF_TYPES.TAG.detect(ref)) {
          seed.tags.push(REF_TYPES.TAG.extractName(ref));
          return seed;
        }

        throw Error(`Unknown ref type for: ${ref}`);
      },
      accumulator,
    );

  const lowerFilterText = filterText.toLocaleLowerCase();
  const filter = lowerFilterText
    ? (ref: string) => ref.toLocaleLowerCase().includes(lowerFilterText) && ref !== 'HEAD'
    : (ref: string) => ref !== 'HEAD';

  function onlyUnique (value: string, index: number, self: string[]) {
    return self.indexOf(value) === index;
  }

  return {
    branches: branches
      .filter(filter)
      .filter(onlyUnique)
      .sort(),
    tags: tags
      .filter(filter)
      .filter(onlyUnique)
      .sort(),
  };
}

export async function isDirty () {
  const { status } = await exec('git diff --no-ext-diff --quiet --exit-code', { output: OutputMode.None });
  return status.code !== 0;
}
