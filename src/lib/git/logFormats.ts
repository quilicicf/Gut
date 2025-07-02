import { stoyle, stoyleGlobal, theme } from '../../dependencies/stoyle.ts';

import { Commit } from './Commit.ts';

export type LogFormat = (commits: Commit[]) => string

export const ASCII_GROUP_SEPARATOR = String.fromCharCode(0x1E);
export const ASCII_UNIT_SEPARATOR = String.fromCharCode(0x1F);
const PARTS = [ // From : man git log
  '%H', // Long-form hash
  '%s', // Subject line
  '%an', // Author name
  '%cr', // Committer date, relative
  '%D', // Ref names without the " (", ")"
  '%b', // Body
];

export const ASV_FORMAT_ARGUMENT = `--pretty=format:${PARTS.join(ASCII_UNIT_SEPARATOR)}${ASCII_GROUP_SEPARATOR}`;

export const LOG_FORMATS: { [ key: string ]: LogFormat } = {
  JSON: (commits: Commit[]): string => `${JSON.stringify(commits)}`,
  SHA: (commits: Commit[]): string => `${commits.map(({ sha }) => sha).join('\n')}`,
  SUBJECT: (commits: Commit[]): string => `${commits.map(({ subject }) => subject).join('\n')}`,
  FULL_BODY: (commits: Commit[]): string => commits
    .map((commit: Commit) => (
      commit.body?.length
        ? stoyle`${commit.subject}\n\n${commit.body}`({ nodes: [ theme.strong, undefined ] })
        : stoyleGlobal`${commit.subject}`(theme.strong)
    ))
    .join('\n=====================================\n'),
  SIMPLE: (commits: Commit[]): string => commits
    .map((commit: Commit) => stoyle`${commit.sha.substr(0, 7)} ${commit.subject} ${`<${commit.author}>`}`(
      { nodes: [ theme.sha, undefined, theme.author ] },
    ))
    .join('\n'),
  PRETTY: (commits: Commit[]): string => commits
    .map((commit: Commit) => (
      stoyle`${commit.sha}\n\t${commit.subject} ${`(${commit.relativeDate})`} ${`<${commit.author}>`}\n\t${`(${commit.branches.join(', ')})`}`(
        { nodes: [ theme.sha, undefined, theme.relativeDate, theme.author, theme.branches ] },
      )))
    .join('\n'),
};
