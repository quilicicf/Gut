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
  const startIndexArgument = options.startIndex ? [ generatePositionArgument(options.startIndex) ] : [];
  const fileTypeArgument = options.fileType ? [ '-filetype', options.fileType ] : [];

  const process = Deno.run({
    cmd: [
      'micro',
      ...fileTypeArgument,
      ...startIndexArgument,
    ],
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'null',
  });

  if (options.startTemplate && process?.stdin?.write) {
    await process.stdin.write(new TextEncoder().encode(options.startTemplate));
    process.stdin.close();
  }

  const result = await process.output();
  process.close();

  const resultAsText = new TextDecoder().decode(result);

  if (options.outputFilePath) {
    await Deno.writeTextFile(options.outputFilePath, resultAsText);
  }

  return resultAsText;
}
