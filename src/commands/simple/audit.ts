import { getCommitsFromParentBranch } from '../../lib/git.ts';

import log from '../../dependencies/log.ts';
import { exec, OutputMode } from '../../dependencies/exec.ts';
import { detect as detectEol } from '../../dependencies/fs.ts';
import {
  isEmpty, pad, padLeft, padRight, set, size,
} from '../../dependencies/ramda.ts';
import {
  __, applyStyle, theme,
} from '../../dependencies/colors.ts';

const REGEX_LINE_ADDED = /^\+/;
const REGEX_LINE_REMOVED = /^-/;
const REGEX_LINE_OLD_FILE_PATH = /^---/;
const REGEX_LINE_NEW_FILE_PATH = /^\+\+\+/;
const REGEX_LINE_NEW_FILE = /diff --git a\/(?:[^ ]+) b\/([^ ]+)/;
const REGEX_LINE_START_DIFF = /^@@ -([0-9]+)(?:,(?:[0-9]+))? \+([0-9]+)(?:,(?:[0-9]+))? @@/;

const ODDITY_PATTERNS = [
  // TODO: add absolute paths detection
  {
    displayName: 'console.log',
    pattern: /console\.log\(/,
  },
  {
    displayName: 'system.out.print',
    pattern: /System\.out\.print/,
  },
  {
    displayName: 'TODO',
    pattern: /TODO/,
  },
  {
    displayName: 'FIXME',
    pattern: /FIXME/,
  },
];

enum LineType {
  LINE_ADDED,
  LINE_REMOVED,
}

const MODIFIED_LINES_DISPLAY_WIDTH = 8;

interface Args {
  commitsNumber?: number,
  from?: string,
  to?: string,
  fromParentBranch?: boolean,

  // Test thingies
  isTestRun: boolean
}

interface Oddity {
  oddityType: string,
  line: string,
  lineType: LineType,
  lineNumber: number,
}

interface OdditiesMap {
  [ fileName: string ]: Oddity[]
}

export interface ParsingState {
  lines: {
    added: number,
    removed: number,
  },
  current: {
    fileName: string,
    oldLineNumber: number,
    newLineNumber: number,
  },
  modifiedFiles: number,
  oddities: OdditiesMap,
}

function findOddities (state: ParsingState, line: string, lineType: LineType): OdditiesMap {
  return ODDITY_PATTERNS
    .reduce(
      (seed: OdditiesMap, oddityPattern) => {
        if (oddityPattern.pattern.test(line)) {
          const oddity = {
            oddityType: oddityPattern.displayName,
            line: line.substring(1),
            lineType,
            lineNumber: lineType === LineType.LINE_ADDED
              ? state.current.newLineNumber
              : state.current.oldLineNumber,
          };
          const index = size(seed[ state.current.fileName ]);
          return set(seed, [ state.current.fileName, index ], oddity);
        }

        return seed;
      },
      state.oddities,
    );
}

function updateParsingState (path: string[], value: any | null): (_: ParsingState) => ParsingState {
  return (state) => set(state, path, value);
}

function parseLine (seed: ParsingState, line: string): ParsingState {
  if (REGEX_LINE_NEW_FILE_PATH.test(line) || REGEX_LINE_OLD_FILE_PATH.test(line)) {
    return seed;
  }

  if (REGEX_LINE_ADDED.test(line)) {
    const newOddities = findOddities(seed, line, LineType.LINE_ADDED);
    return [
      updateParsingState([ 'oddities' ], newOddities),
      updateParsingState([ 'lines', 'added' ], seed.lines.added + 1),
      updateParsingState([ 'current', 'newLineNumber' ], seed.current.newLineNumber + 1),
    ].reduce((accu: ParsingState, modifier) => modifier(accu), seed);
  }

  if (REGEX_LINE_REMOVED.test(line)) {
    const newOddities = findOddities(seed, line, LineType.LINE_REMOVED);
    return [
      updateParsingState([ 'oddities' ], newOddities),
      updateParsingState([ 'lines', 'removed' ], seed.lines.removed + 1),
      updateParsingState([ 'current', 'oldLineNumber' ], seed.current.oldLineNumber + 1),
    ].reduce((accu: ParsingState, modifier) => modifier(accu), seed);
  }

  if (REGEX_LINE_NEW_FILE.test(line)) {
    const [ , fileName ] = REGEX_LINE_NEW_FILE.exec(line) || [];
    return [
      updateParsingState([ 'current', 'fileName' ], fileName),
      updateParsingState([ 'modifiedFiles' ], seed.modifiedFiles + 1),
      updateParsingState([ 'current', 'oldLineNumber' ], 0),
      updateParsingState([ 'current', 'newLineNumber' ], 0),
    ].reduce((accu: ParsingState, modifier) => modifier(accu), seed);
  }

  if (REGEX_LINE_START_DIFF.test(line)) {
    const [ , oldLineNumber, newLineNumber ] = REGEX_LINE_START_DIFF.exec(line) || [];
    return [
      updateParsingState([ 'current', 'oldLineNumber' ], parseInt(oldLineNumber, 10)),
      updateParsingState([ 'current', 'newLineNumber' ], parseInt(newLineNumber, 10)),
    ].reduce((accu: ParsingState, modifier) => modifier(accu), seed);
  }

  return seed;
}

function parseDiff (diff: string, eol: string): ParsingState {
  return diff.split(eol)
    .reduce(
      (seed, line) => parseLine(seed, line),
      {
        lines: {
          added: 0,
          removed: 0,
        },
        current: {
          fileName: '',
          oldLineNumber: 0,
          newLineNumber: 0,
        },
        modifiedFiles: 0,
        oddities: {},
      },
    );
}

async function generateDiff (args: Args): Promise<string> {
  const {
    fromParentBranch, commitsNumber,
    from, to, // TODO: should be a default but yargs fails on conflicts rule if set
  } = args;

  if (commitsNumber) {
    const { output: diff } = await exec(`git --no-pager diff -U0 --no-color HEAD~${commitsNumber}..HEAD`, { output: OutputMode.Capture });
    return diff;
  }

  if (fromParentBranch) {
    const branchOnlyCommits = await getCommitsFromParentBranch(false);
    const numberOfCommits = branchOnlyCommits.length;
    await log(Deno.stdout, applyStyle(__`The current PR had ${String(numberOfCommits)} commit(s)\n`, [ theme.commitsNumber ]));

    if (numberOfCommits < 1) { return ''; }
    const { output: diff } = await exec(`git --no-pager diff -U0 --no-color HEAD~${numberOfCommits}..HEAD`, { output: OutputMode.Capture });
    return diff;
  }

  const { output: diff } = from
    ? await exec(`git --no-pager diff -U0 --no-color ${from}..${to}`, { output: OutputMode.Capture })
    : await exec('git --no-pager diff HEAD -U0 --no-color', { output: OutputMode.Capture });
  return diff;
}

function printFileDiff (parsedDiff: ParsingState): string {
  const width = (MODIFIED_LINES_DISPLAY_WIDTH * 2) + 10;
  const modifiedFilesLine = pad(`Modified files: ${parsedDiff.modifiedFiles}`, width);
  const separator = padRight('', width, '=');
  return applyStyle(
    `${separator}\n${modifiedFilesLine}\n${separator}\n`,
    [ theme.strong ],
  );
}

function printLineDiff (parsedDiff: ParsingState): string {
  const addedPertenage = Math.round((
    (parsedDiff.lines.added * 10) / (parsedDiff.lines.added + parsedDiff.lines.removed)
  ));
  const removedPertenage = 10 - addedPertenage;

  const paddedPlusSigns = padRight(`+++${parsedDiff.lines.added}`, MODIFIED_LINES_DISPLAY_WIDTH, ' ');
  const addedProportion = padRight('', addedPertenage, '◼');

  const removedProportion = padRight('', removedPertenage, '◼');
  const paddedMinusSigns = padLeft(`${parsedDiff.lines.removed}---`, MODIFIED_LINES_DISPLAY_WIDTH, ' ');

  return applyStyle(
    __`${paddedPlusSigns}${addedProportion}${removedProportion}${paddedMinusSigns}\n`,
    [ theme.success, theme.success, theme.error, theme.error ],
  );
}

function printOddities (parsedDiff: ParsingState): string {
  if (isEmpty(parsedDiff.oddities)) {
    return applyStyle('No oddities found, good job Bob!\n', [ theme.success ]);
  }

  return Object.entries(parsedDiff.oddities).reduce(
    (seed, [ fileName, oddities ]) => {
      if (isEmpty(oddities)) { return seed; }

      const removedOdditiesTypes = oddities
        .filter((oddity) => oddity.lineType === LineType.LINE_REMOVED)
        .map((oddity) => oddity.oddityType);

      return seed
        + applyStyle(`File ${fileName}\n`, [ theme.fileName ])
        + oddities
          .filter((oddity) => oddity.lineType === LineType.LINE_ADDED)
          .reduce(
            (accu, oddity) => {
              const warningMessage = removedOdditiesTypes.includes(oddity.oddityType)
                ? '(it may only be a modification)'
                : '';

              const header = applyStyle(
                __`  Found a ${oddity.oddityType} ${warningMessage}\n`,
                [ theme.emphasis, theme.dim ],
              );
              const body = applyStyle(
                __`      ${oddity.lineNumber.toString()}: ${oddity.line}\n`,
                [ theme.lineNumber, theme.important ],
              );
              return accu + header + body;
            },
            '',
          );
    },
    '',
  );
}

async function displayDiff (parsedDiff: ParsingState) {
  await log(Deno.stdout, printFileDiff(parsedDiff));
  await log(Deno.stdout, printLineDiff(parsedDiff));
  await log(Deno.stdout, printOddities(parsedDiff));
}

export async function parseDiffAndDisplay (diff: string) {
  const eol = detectEol(diff) || '\n';
  const parsedDiff = parseDiff(diff, eol);
  await displayDiff(parsedDiff);
}

export const command = 'audit';
export const aliases = [ 'a' ];
export const describe = 'Audits a given diff';

export function builder (yargs: any) {
  return yargs.usage('usage: gut audit [options]')
    .option('commits-number', {
      alias: 'n',
      describe: 'The number of commits to inspect',
      type: 'integer',
      conflicts: [ 'from', 'to' ],
    })
    .option('from-parent-branch', {
      alias: 'p',
      describe: 'Audit all commits on top of the parent branch',
      type: 'boolean',
    })
    .option('from', {
      alias: 'f',
      describe: 'The sha of the commit from which the diff starts',
      type: 'string',
      conflicts: [ 'commits-number', 'from-parent-branch' ],
    })
    .option('to', {
      alias: 't',
      describe: 'The sha of the commit where the diff ends',
      type: 'string',
      conflicts: [ 'commits-number', 'from-parent-branch' ],
    });
}

export async function handler (args: Args) {
  const { isTestRun } = args;

  const diff = await generateDiff(args);
  const eol = detectEol(diff) || '\n';
  const parsedDiff = parseDiff(diff, eol);

  if (!isTestRun) {
    await displayDiff(parsedDiff);
  }
}

export const test = {
  generateDiff,
  parseDiff,
  printFileDiff,
  printLineDiff,
  printOddities,
};
