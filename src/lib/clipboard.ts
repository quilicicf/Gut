import { getPermissionOrExit } from './getPermissionOrExit.ts';

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

interface Command {
  programName: string,
  writeText: (data: string) => Promise<number>,
}

type CommandsByOs = {
  windows: Command,
  darwin: Command,
  linux: Command,
};

const COMMANDS_BY_OS: CommandsByOs = {
  windows: {
    programName: 'powershell',
    async writeText (data: string): Promise<number> {
      return writeText([ 'powershell', '-noprofile', '-command', '$input|Set-Clipboard' ], data);
    },
  },
  darwin: {
    programName: 'pbcopy',
    async writeText (data: string): Promise<number> {
      return writeText([ 'pbcopy' ], data);
    },
  },
  linux: {
    programName: 'xclip',
    async writeText (data: string): Promise<number> {
      return writeText([ 'xclip', '-selection', 'clipboard' ], data);
    },
  },
};

export async function writeToClipboard (data: string): Promise<number> {
  const command = COMMANDS_BY_OS[ Deno.build.os ];
  await getPermissionOrExit({ name: 'run', command: command.programName });
  return command.writeText(data);
}
