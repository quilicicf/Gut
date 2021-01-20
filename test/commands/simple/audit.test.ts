import { detect as detectEol } from '../../../src/dependencies/fs.ts';
import { initializeRepository, deleteRepositories } from '../../utils/setup.ts';
import {
  RESET_CODE, __, applyStyle, theme,
} from '../../../src/dependencies/colors.ts';

import { assertEquals } from '../../utils/assert.ts';
import { ParsingState, test } from '../../../src/commands/simple/audit.ts';
import { resolve } from '../../../src/dependencies/path.ts';
import { exec, execSequence, OutputMode } from '../../../src/dependencies/exec.ts';

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

const fileDiff = `${theme.strong}\
==========================
    Modified files: 1     
==========================
${RESET_CODE}`;

const lineDiff = `${theme.success}+++4    ◼◼◼◼${theme.error}◼◼◼◼◼◼    6---${RESET_CODE}\n`;

const oddities = `${theme.fileName}File index.ts
${RESET_CODE}\
  Found a ${theme.emphasis}FIXME${RESET_CODE} 
      ${theme.lineNumber}18${RESET_CODE}: ${theme.important}// FIXME: use a better formatting${RESET_CODE}
  Found a ${theme.emphasis}console.log${RESET_CODE} ${theme.dim}(it may only be a modification)${RESET_CODE}
      ${theme.lineNumber}25${RESET_CODE}: ${theme.important}console.log('Updated :wink:');${RESET_CODE}
`;

const command = 'gut audit';

Deno.test(applyStyle(__`@unit ${command} should parse diff`, [ theme.strong ]), () => {
  const eol = detectEol(diff) || '\n';
  const output = parseDiff(diff, eol);
  assertEquals(output, parsedDiff);
});

Deno.test(applyStyle(__`@unit ${command} should print file diff`, [ theme.strong ]), () => {
  const output = printFileDiff(parsedDiff);
  assertEquals(output, fileDiff);
});

Deno.test(applyStyle(__`@unit ${command} should print line diff`, [ theme.strong ]), () => {
  const output = printLineDiff(parsedDiff);
  assertEquals(output, lineDiff);
});

Deno.test(applyStyle(__`@unit ${command} should print oddities`, [ theme.strong ]), () => {
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

Deno.test(applyStyle(__`@int ${command} should print oddities`, [ theme.strong ]), async () => {
  const { tmpDir, testRepositoryPath } = await initializeRepository('gut_test_audit');
  await Deno.writeTextFile(resolve(testRepositoryPath, 'index.ts'), firstFileVersion);
  await execSequence([
    'git add . -A',
    'git commit -m "Mkay"',
  ], { output: OutputMode.None });
  await Deno.writeTextFile(resolve(testRepositoryPath, 'index.ts'), secondFileVersion);
  await exec('git add . -A', { output: OutputMode.None });

  const output = await generateDiff({ isTestRun: true });

  await deleteRepositories(tmpDir, testRepositoryPath);

  const removeSha = (input: string): string => input.replace(/[a-f0-9]+\.\.[a-f0-9]+/g, '');
  assertEquals(removeSha(output), removeSha(diff));
});
