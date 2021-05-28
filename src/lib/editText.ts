import { getConstants } from '../constants.ts';
import { writeTextFile } from './writeTextFile.ts';
import { getPermissionOrExit } from './getPermissionOrExit.ts';

const EDITOR_NAME = 'micro';

interface Index {
  line?: number, // Base-1 index of the line. Defaults to 1
  column: number, // Base-1 index of the column
}

export interface EditorOptions {
  startTemplate?: string,
  outputFilePath?: string,
  fileType?: 'markdown' | 'unknown',
  startIndex?: Index
}

const generatePositionArgument = (index: Index) => `+${index.line || 1}:${index.column}`;

export async function editText (options: EditorOptions) {
  await getPermissionOrExit({ name: 'run', command: EDITOR_NAME });

  const startIndexArgument = options.startIndex
    ? [ generatePositionArgument(options.startIndex) ]
    : [ generatePositionArgument({ line: 1, column: 1 }) ];
  const fileTypeArgument = options.fileType ? [ '-filetype', options.fileType ] : [];

  const process = Deno.run({
    cmd: [
      EDITOR_NAME,
      ...fileTypeArgument,
      ...startIndexArgument,
    ],
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'null',
  });

  if (process?.stdin?.write) {
    const startTemplate = options.startTemplate ? options.startTemplate : '\n';
    await process.stdin.write(new TextEncoder().encode(startTemplate));
    process.stdin.close();
  }

  const result = await process.output();
  process.close();

  const resultAsText = new TextDecoder().decode(result);

  if (options.outputFilePath) {
    const { GUT_CONFIGURATION_FOLDER } = await getConstants();
    await writeTextFile(options.outputFilePath, resultAsText, { permissionPath: GUT_CONFIGURATION_FOLDER });
  }

  return resultAsText;
}
