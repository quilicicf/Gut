const writeText = async (cmd: string[], data: string): Promise<number> => {
  const process = Deno.run({
    cmd,
    stdin: 'piped',
    stdout: 'piped',
    stderr: 'piped',
  });
  await process?.stdin?.write(new TextEncoder().encode(data));
  await process?.stdin?.write(new TextEncoder().encode(undefined));
  process?.stdin?.close();
  const { code } = await process.status();
  return code;
};

const programAliases = {
  async windows (data: string): Promise<number> {
    return writeText([ 'powershell', '-noprofile', '-command', '$input|Set-Clipboard' ], data);
  },
  async darwin (data: string): Promise<number> {
    return writeText([ 'pbcopy' ], data);
  },
  async linux (data: string): Promise<number> {
    return writeText([ 'xclip', '-selection', 'clipboard' ], data);
  },
};

export async function writeToClipboard (data: string): Promise<number> {
  const osSpecificCommand = programAliases[ Deno.build.os ];
  return osSpecificCommand(data);
}
