module.exports = (() => {
  const _ = require('lodash');

  const utils = require('./utils');

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
      testFileExtension: fileName => /\.(js|ts|jsx)/.test(fileName),
      oddityPatterns: [
        {
          displayName: 'console.log',
          pattern: /console\.log\(/
        }
      ]
    },
    JAVA: {
      testFileExtension: fileName => /\.(java)/.test(fileName),
      oddityPatterns: [
        {
          displayName: 'system.out.print',
          pattern: /System\.out\.print/
        }
      ]
    },
    ANY: {
      testFileExtension: fileName => false,
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

          _.mergeWith(seed.oddities, newOdditiesForFile, utils.mergeArrayCustomizer);
        }
      });
  };

  const parseLine = (seed, line) => {
    if (REGEX_LINE_NEW_FILE_PATH.test(line) || REGEX_LINE_OLD_FILE_PATH.test(line)) {
      return seed;
    }

    if (REGEX_LINE_ADDED.test(line)) {
      findOddities(seed, line, LINE_TYPES.LINE_ADDED);
      seed.lines.added++;
      seed.current.newLineNumber++;

      return seed;
    }

    if (REGEX_LINE_REMOVED.test(line)) {
      findOddities(seed, line, LINE_TYPES.LINE_REMOVED);
      seed.lines.removed++;
      seed.current.oldLineNumber++;
      return seed;
    }

    if (REGEX_LINE_NEW_FILE.test(line)) {
      seed.current.fileName = REGEX_LINE_NEW_FILE.exec(line)[ 2 ];
      const fileType = _(FILE_TYPES)
        .filter(supportedFileType => supportedFileType.testFileExtension(seed.current.fileName))
        .first();
      seed.current.fileType = fileType || FILE_TYPES.ANY;
      seed.current.oldLineNumber = 0;
      seed.current.newLineNumber = 0;
      return seed;
    }

    if (REGEX_LINE_START_DIFF.test(line)) {
      const parsedLine = REGEX_LINE_START_DIFF.exec(line);
      seed.current.oldLineNumber = parsedLine[ 1 ];
      seed.current.newLineNumber = parsedLine[ 4 ];
    }
    return seed;
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
      oddities: {}
    };
    return _(diff.split(eol))
      .reduce((seed, line) => parseLine(seed, line), parsedDiff);
  };

  const printLineDiff = parsedDiff => {
    const addedPertenage = _.round(parsedDiff.lines.added * 10 / (parsedDiff.lines.added + parsedDiff.lines.removed));
    const removedPertenage = 10 - addedPertenage;
    const fragmentsToPrint = [
      _.padEnd(`+++${parsedDiff.lines.added}`, MODIFIED_LINES_DISPLAY_WIDTH, ' ').green,
      _.pad('', addedPertenage, '◼').green,
      _.pad('', removedPertenage, '◼').red,
      _.padStart(`${parsedDiff.lines.removed}---`, MODIFIED_LINES_DISPLAY_WIDTH, ' ').red
    ];

    utils.print(_.join(fragmentsToPrint, ''));
    utils.print('');
  };

  const printOddities = parsedDiff => {
    if (_.isEmpty(parsedDiff.oddities)) {
      utils.print('No oddities found, good job Bob!'.green);
      return;
    }


    _(parsedDiff.oddities)
      .toPairs()
      .each(oddityPair => {
        const fileName = oddityPair[ 0 ];
        const oddities = oddityPair[ 1 ];

        utils.print(`File ${fileName}`.yellow);

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

            utils.print(`  Found a ${oddity.oddityType.italic}`, warningMessage);
            utils.print(`      ${oddity.lineNumber.toString().magenta}: ${oddity.line.cyan}`);
          });
      });
  };

  return {
    audit: (yargs, os) => {
      const arguments = yargs
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

      let diff;

      const commitsNumber = arguments[ ARGUMENTS.COMMITS_NUMBER.name ];
      const fromBaseBranch = arguments[ ARGUMENTS.FROM_BASE_BRANCH.name ];
      const from = arguments[ ARGUMENTS.FROM.name ];
      const to = arguments[ ARGUMENTS.TO.name ] || 'HEAD'; // TODO: should be a default but yargs fails on conflicts rule if set
      if (commitsNumber) {
        diff = utils.execute(`git --no-pager diff -U0 --no-color HEAD~${commitsNumber}..HEAD`);
      } else if (fromBaseBranch) {
        const branchOnlyCommits = utils.getBranchOnlyCommits();
        const numberOfCommits = _.size(branchOnlyCommits);
        utils.print(`Number of commits for the current PR: ${numberOfCommits}`.cyan);
        diff = numberOfCommits >= 1
          ? utils.execute(`git --no-pager diff -U0 --no-color HEAD~${numberOfCommits}..HEAD`)
          : '';
      } else if (from) {
        diff = utils.execute(`git --no-pager diff -U0 --no-color ${from}..${to}`);
      } else {
        diff = utils.execute('git --no-pager diff -U0 --no-color');
      }

      const parsedDiff = parseDiff(diff, os.EOL);

      printLineDiff(parsedDiff);
      printOddities(parsedDiff);
    }
  };
})();
