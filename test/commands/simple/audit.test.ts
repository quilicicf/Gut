import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';
import { detect as detectEol } from '../../../src/dependencies/fs.ts';

import { assertEquals } from '../../utils/assert.ts';
import {
  initializeRepository, deleteRepositories, startTestLogs, endTestLogs,
} from '../../utils/setup.ts';

import { ParsingState, test } from '../../../src/commands/simple/audit.ts';
import { executeProcessCriticalTasks } from '../../../src/lib/exec/executeProcessCriticalTasks.ts';
import { executeProcessCriticalTask } from '../../../src/lib/exec/executeProcessCriticalTask.ts';

const {
  generateDiff, parseDiff,
  printFileDiff, printLineDiff, printOddities,
} = test;

const diff = `\
diff --git a/index.ts b/index.ts
index c41014f..a96ee2d 100644
--- a/index.ts
+++ b/index.ts
@@ -0,0 +1,2 @@
+/* ts-ignore */
+
@@ -15,0 +18 @@ const boldCyanOnRed = createStyle({
+// FIXME: use a better formatting
@@ -22,6 +25 @@ console.log(applyStyle(
-// Styling a whole string
-const otherParameter = 'EVERYTHING';
-console.log(applyStyle(
-  \`I'm styling $\{otherParameter}\`,
-  [ boldCyanOnRed ],
-));
+console.log('Updated :wink:');\
`;

const parsedDiff: ParsingState = {
  lines: { added: 4, removed: 6 },
  current: {
    fileName: 'index.ts',
    oldLineNumber: 28,
    newLineNumber: 26,
  },
  modifiedFiles: 1,
  oddities: {
    'index.ts': [
      {
        oddityType: 'FIXME',
        line: '// FIXME: use a better formatting',
        lineType: 0,
        lineNumber: 18,
      },
      {
        oddityType: 'console.log',
        line: 'console.log(applyStyle(',
        lineType: 1,
        lineNumber: 24,
      },
      {
        oddityType: 'console.log',
        line: 'console.log(\'Updated :wink:\');',
        lineType: 0,
        lineNumber: 25,
      },
    ],
  },
};

const fileDiff = `\x1b[1m\
==========================
    Modified files: 1     
==========================
\x1b[0m`;

const lineDiff = '\x1b[32m+++4    ◼◼◼◼\x1b[31m◼◼◼◼◼◼    6---\x1b[0m\n';

const oddities = `\x1b[38;2;230;219;116mFile index.ts
\x1b[0m\
  Found a \x1b[3mFIXME\x1b[0m 
      \x1b[38;2;174;129;255m18\x1b[0m: \x1b[38;2;102;217;239m// FIXME: use a better formatting\x1b[0m
  Found a \x1b[3mconsole.log\x1b[0m \x1b[2m(it may only be a modification)\x1b[0m
      \x1b[38;2;174;129;255m25\x1b[0m: \x1b[38;2;102;217;239mconsole.log('Updated :wink:');\x1b[0m
`;

const command = 'gut audit';

Deno.test(stoyle`@unit ${command} should parse diff`({ nodes: [ theme.strong ] }), () => {
  const eol = detectEol(diff) || '\n';
  const output = parseDiff(diff, eol);
  assertEquals(output, parsedDiff);
});

Deno.test(stoyle`@unit ${command} should print file diff`({ nodes: [ theme.strong ] }), () => {
  const output = printFileDiff(parsedDiff);
  assertEquals(output, fileDiff);
});

Deno.test(stoyle`@unit ${command} should print line diff`({ nodes: [ theme.strong ] }), () => {
  const output = printLineDiff(parsedDiff);
  assertEquals(output, lineDiff);
});

Deno.test(stoyle`@unit ${command} should print oddities`({ nodes: [ theme.strong ] }), () => {
  const output = printOddities(parsedDiff);
  assertEquals(output, oddities);
});

const firstFileVersion = `\
// TODO: the links may need to be changed.
import {
  BackgroundCode, ForegroundCode, StyleCode, createStyle,
} from 'https://raw.githubusercontent.com/quilicicf/ColorMee/master/createStyle.ts';
import {
  parse, applyStyle, StyleMode,
} from 'https://raw.githubusercontent.com/quilicicf/ColorMee/master/index.ts';

const boldCyanOnRed = createStyle({
  foreground: ForegroundCode.Cyan,
  background: BackgroundCode.Red,
  style: StyleCode.Bold,
});

// Styling parameters of a string
const parameter = 'this';
console.log(applyStyle(
  parse\`I'm styling $\{parameter}, but not $\{parameter}.\`,
  [ boldCyanOnRed, null /* Null style => no style */ ],
));

// Styling a whole string
const otherParameter = 'EVERYTHING';
console.log(applyStyle(
  \`I'm styling $\{otherParameter}\`,
  [ boldCyanOnRed ],
));
`;
const secondFileVersion = `\
/* ts-ignore */

// TODO: the links may need to be changed.
import {
  BackgroundCode, ForegroundCode, StyleCode, createStyle,
} from 'https://raw.githubusercontent.com/quilicicf/ColorMee/master/createStyle.ts';
import {
  parse, applyStyle, StyleMode,
} from 'https://raw.githubusercontent.com/quilicicf/ColorMee/master/index.ts';

const boldCyanOnRed = createStyle({
  foreground: ForegroundCode.Cyan,
  background: BackgroundCode.Red,
  style: StyleCode.Bold,
});

// Styling parameters of a string
// FIXME: use a better formatting
const parameter = 'this';
console.log(applyStyle(
  parse\`I'm styling $\{parameter}, but not $\{parameter}.\`,
  [ boldCyanOnRed, null /* Null style => no style */ ],
));

console.log('Updated :wink:');
`;

Deno.test(stoyle`@int ${command} should print oddities`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_audit');
  await Deno.writeTextFile('index.ts', firstFileVersion);
  await executeProcessCriticalTasks([
    [ 'git', 'add', '.', '--all' ],
    [ 'git', 'commit', '--message', 'Mkay' ],
  ]);
  await Deno.writeTextFile('index.ts', secondFileVersion);
  await executeProcessCriticalTask([ 'git', 'add', '.', '--all' ]);

  const output = await generateDiff({});

  await deleteRepositories(repository);

  const removeSha = (input: string): string => input.replace(/[a-f0-9]+\.\.[a-f0-9]+/g, '');

  await endTestLogs();
  assertEquals(removeSha(output), removeSha(diff));
});
