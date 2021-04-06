import { __, applyStyle, theme } from '../../dependencies/colors.ts';

import { Commit } from './Commit.ts';

export type LogFormat = (commits: Commit[]) => string

export const PSV_FORMAT_ARGUMENT = '--pretty=format:%H|%s|%an|%cr|%D';

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
