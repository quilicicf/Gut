import { isEmpty } from '../src/dependencies/ramda.ts';
import { fromFileUrl, resolve } from '../src/dependencies/path.ts';
import { Command, ExtraPermissions, YargsOptions } from '../src/dependencies/yargs.ts';

import * as audit from '../src/commands/simple/audit.ts';
import * as burgeon from '../src/commands/simple/burgeon.ts';
import * as divisions from '../src/commands/simple/divisions.ts';
import * as execute from '../src/commands/simple/execute.ts';
import * as pile from '../src/commands/simple/pile.ts';
import * as history from '../src/commands/simple/history.ts';
import * as obliterate from '../src/commands/simple/obliterate.ts';
import * as replicate from '../src/commands/simple/replicate.ts';
import * as _switch from '../src/commands/simple/switch.ts';
import * as thrust from '../src/commands/simple/thrust.ts';
import * as undo from '../src/commands/simple/undo.ts';
import * as _yield from '../src/commands/simple/yield.ts';

import * as pr from '../src/commands/advanced/pr/pr.ts';

import * as install from '../src/commands/internals/install.ts';

const toMarkdownExtraPermissions = (permissions: ExtraPermissions): string => `

__Extra permissions:__

|Permission|Value|Reason|
|----------|-----|------|
${
  Object.entries(permissions)
    .map(([ name, permission ]) => (
      `|\`${name}\`|${permission.value}|${permission.description}|`
    ))
    .join('\n')
}
`;

const toMarkdownOptions = (options: YargsOptions): string => `

__Options:__

|Name|Description|Type|Required|Default value|
|----|-----------|----|--------|-------------|
${
  Object.entries(options)
    .map(([ name, option ]) => {
      const defaultValue = option.default ? `\`${option.default}\`` : '';
      return `|\`${name}\`|${option.describe}|\`${option.type}\`|${!!option.demandOption}|${defaultValue}|`;
    })
    .join('\n')
}
`;

const toMarkdownSection = (command: Command) => `\
#### ${command.command}

${command.describe}

\`${command.usage}\`\
${isEmpty(command.options) ? '' : toMarkdownOptions(command.options)}\
${isEmpty(command.extraPermissions) ? '' : toMarkdownExtraPermissions(command.extraPermissions)}\
`;

const toMarkdownSections = (commands: Command[]) => commands
  .map((command) => toMarkdownSection(command))
  .join('\n');

const main = async () => {
  const markdownSections = [];

  markdownSections.push('<!-- START CLI DOC -->');
  markdownSections.push([
    '### Internals',
    '',
    '> Commands dedicated to Gut configuration',
    '',
  ].join('\n'));
  markdownSections.push(toMarkdownSections([ install ]));

  markdownSections.push([
    '### Simple commands',
    '',
    '> Commands that improve an existing git feature',
    '',
  ].join('\n'));
  markdownSections.push(toMarkdownSections([
    audit, burgeon, divisions, execute, pile, history, obliterate, replicate, _switch, thrust, undo, _yield,
  ]));

  markdownSections.push([
    '### Advanced commands',
    '',
    '> Commands that either connect to external tools or combine multiple git features',
    '',
  ].join('\n'));
  markdownSections.push(toMarkdownSections([ pr ]));
  markdownSections.push('<!-- END CLI DOC -->');

  const fullMarkdownContent = markdownSections.join('\n');

  const currentScriptFilePath = fromFileUrl(import.meta.url);
  const appRootPath = resolve(currentScriptFilePath, '..', '..');
  const readmePath = resolve(appRootPath, 'README.md');
  const initialReadmeContent = await Deno.readTextFile(readmePath);

  const updatedReadmeContent = initialReadmeContent
    .replace(/<!-- START CLI DOC -->.*<!-- END CLI DOC -->/s, fullMarkdownContent);

  const markdownFormatterPath = resolve(appRootPath, 'node_modules', '@quilicicf', 'markdown-formatter', 'bin', 'markdown-formatter.js');
  await Deno.writeTextFile(readmePath, updatedReadmeContent);
  const { success, code } = await Deno.run({
    cmd: [ 'node', markdownFormatterPath, '--file', readmePath, '--replace' ],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'piped',
  }).status();

  if (!success) { throw Error(`Markdown formatting ended in status ${code}`); }
};

main()
  .catch(async (error) => {
    await Deno.stdout.write(new TextEncoder().encode(error.stack));
    Deno.exit(1);
  });
