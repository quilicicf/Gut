const _ = require('lodash');
const os = require('os');

const branches = require('../utils/branches');
const execution = require('../utils/execution');

module.exports = (() => {
  const ARGUMENTS = {
    COMMITS_NUMBER: {
      name: 'commits-number',
      alias: 'n',
      describe: 'The number of commits to inspect',
      type: 'integer',
      conflicts: [ 'from', 'to' ]
    },
    FROM_BASE_BRANCH: {
      name: 'from-base-branch',
      alias: 'b',
      describe: 'Audit all commits on top of the base branch',
      type: 'boolean'
    },
    FROM: {
      name: 'from',
      alias: 'f',
      describe: 'The sha of the commit from which the diff starts',
      type: 'string',
      conflicts: [ 'commits-number', 'from-base-branch' ]
    },
    TO: {
      name: 'to',
      alias: 't',
      describe: 'The sha of the commit where the diff ends',
      type: 'string',
      conflicts: [ 'commits-number', 'from-base-branch' ]
    }
  };

  const REGEX_LINE_ADDED = /^\+/;
  const REGEX_LINE_REMOVED = /^-/;
  const REGEX_LINE_OLD_FILE_PATH = /^---/;
  const REGEX_LINE_NEW_FILE_PATH = /^\+\+\+/;
  const REGEX_LINE_NEW_FILE = /diff --git a\/([^ ]+) b\/([^ ]+)/;
  const REGEX_LINE_START_DIFF = /^@@ -([0-9]+)(,([0-9]+))? \+([0-9]+)(,([0-9]+))? @@/;
  const FILE_TYPES = {
    JS: {
      testFileExtension: fileName => /\.(js|ts|jsx)$/.test(fileName),
      oddityPatterns: [
        {
          displayName: 'console.log',
          pattern: /console\.log\(/
        }
      ]
    },
    JAVA: {
      testFileExtension: (fileName) => /\.(java)$/.test(fileName),
      oddityPatterns: [
        {
          displayName: 'system.out.print',
          pattern: /System\.out\.print/
        }
      ]
    },
    ANY: {
      testFileExtension: () => false,
      oddityPatterns: [
        {
          displayName: 'TODO',
          pattern: /TODO/
        },
        {
          displayName: 'FIXME',
          pattern: /FIXME/
        }
      ]
    }
  };

  const LINE_TYPES = {
    LINE_ADDED: 'lineAdded',
    LINE_REMOVED: 'lineRemoved'
  };

  const MODIFIED_LINES_DISPLAY_WIDTH = 8;

  const mergeArrayCustomizer = (seed, otherSource) => {
    if (!seed) {
      return otherSource;
    }

    const seedArray = _.isArray(seed) ? seed : [ seed ];
    return seedArray.concat(otherSource);
  };

  const findOddities = (seed, line, lineType) => {
    _([ ...seed.current.fileType.oddityPatterns, ...FILE_TYPES.ANY.oddityPatterns ])
      .each(oddityPattern => {
        if (oddityPattern.pattern.test(line)) {
          const newOdditiesForFile = {};
          newOdditiesForFile[ seed.current.fileName ] = [
            {
              oddityType: oddityPattern.displayName,
              line: line.substring(1),
              lineType: lineType,
              lineNumber: lineType === LINE_TYPES.LINE_ADDED
                ? seed.current.newLineNumber
                : seed.current.oldLineNumber
            }
          ];

          _.mergeWith(seed.oddities, newOdditiesForFile, mergeArrayCustomizer);
        }
      });
  };

  const parseLine = (seed, line) => {
    if (REGEX_LINE_NEW_FILE_PATH.test(line) || REGEX_LINE_OLD_FILE_PATH.test(line)) {
      return seed;
    }

    const newSeed = _.cloneDeep(seed);
    if (REGEX_LINE_ADDED.test(line)) {
      findOddities(newSeed, line, LINE_TYPES.LINE_ADDED);
      newSeed.lines.added++;
      newSeed.current.newLineNumber++;

      return newSeed;
    }

    if (REGEX_LINE_REMOVED.test(line)) {
      findOddities(newSeed, line, LINE_TYPES.LINE_REMOVED);
      newSeed.lines.removed++;
      newSeed.current.oldLineNumber++;
      return newSeed;
    }

    if (REGEX_LINE_NEW_FILE.test(line)) {
      newSeed.current.fileName = REGEX_LINE_NEW_FILE.exec(line)[ 2 ];
      const fileType = _(FILE_TYPES)
        .filter(supportedFileType => supportedFileType.testFileExtension(newSeed.current.fileName))
        .first();
      newSeed.modifiedFiles++;
      newSeed.current.fileType = fileType || FILE_TYPES.ANY;
      newSeed.current.oldLineNumber = 0;
      newSeed.current.newLineNumber = 0;
      return newSeed;
    }

    if (REGEX_LINE_START_DIFF.test(line)) {
      const parsedLine = REGEX_LINE_START_DIFF.exec(line);
      newSeed.current.oldLineNumber = parsedLine[ 1 ];
      newSeed.current.newLineNumber = parsedLine[ 4 ];
    }
    return newSeed;
  };

  const parseDiff = (diff, eol) => {
    const parsedDiff = {
      lines: {
        added: 0,
        removed: 0
      },
      current: {
        fileName: '',
        fileType: '',
        oldLineNumber: 0,
        newLineNumber: 0
      },
      modifiedFiles: 0,
      oddities: {}
    };
    return _(diff.split(eol))
      .reduce((seed, line) => parseLine(seed, line), parsedDiff);
  };

  const printFileDiff = (parsedDiff) => {
    const modifiedFilesLine = `Modified files: ${parsedDiff.modifiedFiles}`;
    const separator = _.pad('', _.size(modifiedFilesLine) + 4, '=');
    execution.print(`${separator}\n  ${modifiedFilesLine}\n${separator}\n`.bold);
  };

  const printLineDiff = (parsedDiff) => {
    const addedPertenage = _.round((parsedDiff.lines.added * 10) / (parsedDiff.lines.added + parsedDiff.lines.removed));
    const removedPertenage = 10 - addedPertenage;
    const fragmentsToPrint = [
      _.padEnd(`+++${parsedDiff.lines.added}`, MODIFIED_LINES_DISPLAY_WIDTH, ' ').green,
      _.pad('', addedPertenage, '◼').green,
      _.pad('', removedPertenage, '◼').red,
      _.padStart(`${parsedDiff.lines.removed}---`, MODIFIED_LINES_DISPLAY_WIDTH, ' ').red
    ];

    execution.print(_.join(fragmentsToPrint, ''));
    execution.print('');
  };

  const printOddities = parsedDiff => {
    if (_.isEmpty(parsedDiff.oddities)) {
      execution.print('No oddities found, good job Bob!'.green);
      return;
    }


    _(parsedDiff.oddities)
      .toPairs()
      .each(oddityPair => {
        const fileName = oddityPair[ 0 ];
        const oddities = oddityPair[ 1 ];

        execution.print(`File ${fileName}`.yellow);

        const removedOdditiesTypes = _(oddities)
          .filter(oddity => oddity.lineType === LINE_TYPES.LINE_REMOVED)
          .map(oddity => oddity.oddityType)
          .value();

        _(oddities)
          .filter(oddity => oddity.lineType === LINE_TYPES.LINE_ADDED)
          .each(oddity => {
            const warningMessage = _.includes(removedOdditiesTypes, oddity.oddityType)
              ? '(it may only be a modification)'.white.dim
              : '';

            execution.print(`  Found a ${oddity.oddityType.italic}`, warningMessage);
            execution.print(`      ${oddity.lineNumber.toString().magenta}: ${oddity.line.cyan}`);
          });
      });
  };

  const parseDiffAndDisplay = (diff) => {
    const parsedDiff = parseDiff(diff, os.EOL);

    printFileDiff(parsedDiff);
    printLineDiff(parsedDiff);
    printOddities(parsedDiff);
  };

  return {
    parseDiffAndDisplay,
    audit: (yargs) => {
      const args = yargs
        .usage('usage: $0 audit [options]')
        // TODO: add a description of what it does when there's no commits number
        .option(ARGUMENTS.COMMITS_NUMBER.name, ARGUMENTS.COMMITS_NUMBER)
        .option(ARGUMENTS.FROM_BASE_BRANCH.name, ARGUMENTS.FROM_BASE_BRANCH)
        .option(ARGUMENTS.FROM.name, ARGUMENTS.FROM)
        .option(ARGUMENTS.TO.name, ARGUMENTS.TO)
        .coerce(ARGUMENTS.COMMITS_NUMBER.name, argument => {
          if (argument < 1) {
            throw Error('The commits number must be greater than 0'.red);
          }

          return argument;
        })
        .help()
        .argv;

      const commitsNumber = args[ ARGUMENTS.COMMITS_NUMBER.name ];
      const fromBaseBranch = args[ ARGUMENTS.FROM_BASE_BRANCH.name ];
      const from = args[ ARGUMENTS.FROM.name ];
      const to = args[ ARGUMENTS.TO.name ] || 'HEAD'; // TODO: should be a default but yargs fails on conflicts rule if set

      if (commitsNumber) {
        const diff = execution.execute(`git --no-pager diff -U0 --no-color HEAD~${commitsNumber}..HEAD`);
        parseDiffAndDisplay(diff);

      } else if (fromBaseBranch) {
        const branchOnlyCommits = branches.getBranchOnlyCommits();
        const numberOfCommits = _.size(branchOnlyCommits);
        execution.print(`Number of commits for the current PR: ${numberOfCommits}`.cyan);
        const diff = numberOfCommits >= 1
          ? execution.execute(`git --no-pager diff -U0 --no-color HEAD~${numberOfCommits}..HEAD`)
          : '';

        parseDiffAndDisplay(diff);

      } else if (from) {
        const diff = execution.execute(`git --no-pager diff -U0 --no-color ${from}..${to}`);
        parseDiffAndDisplay(diff);

      } else {
        const diff = execution.execute('git --no-pager diff -U0 --no-color');
        parseDiffAndDisplay(diff);
      }
    }
  };
})();
