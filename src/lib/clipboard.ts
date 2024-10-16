import { getPermissionOrExit } from './getPermissionOrExit.ts';

const writeText = async (cmd: string, args: string[], data: string): Promise<number> => {
  const command = new Deno.Command(cmd, {
    args,
    stdin: 'piped',
    stdout: null,
    stderr: null,
  });
  const process = await command.spawn();
  const writer = process.stdin.getWriter();
  await writer.write(new TextEncoder().encode(data));
  await writer.releaseLock();
  await process.stdin.close();
  const { code } = await process.output();
  return code;
};

interface Command {
  programName: string,
  writeText: (data: string) => Promise<number>,
}

interface CommandsByOs {
  windows: Command,
  darwin: Command,
  linuxOnX: Command,
  linuxOnWayland: Command,
}

const COMMANDS_BY_OS: CommandsByOs = {
  windows: {
    programName: 'powershell',
    async writeText(data: string): Promise<number> {
      return writeText('powershell', ['-noprofile', '-command', '$input|Set-Clipboard'], data);
    },
  },
  darwin: {
    programName: 'pbcopy',
    async writeText(data: string): Promise<number> {
      return writeText('pbcopy', [], data);
    },
  },
  linuxOnX: {
    programName: 'xclip',
    async writeText(data: string): Promise<number> {
      return writeText('xclip', ['-selection', 'clipboard'], data);
    },
  },
  linuxOnWayland: {
    programName: 'wl-copy',
    async writeText(data: string): Promise<number> {
      return writeText('wl-copy', [], data);
    },
  },
};

async function computePlatform(os) {
  if (os !== 'linux') {
    return os;
  }

  await getPermissionOrExit({ name: 'env', variable: 'XDG_SESSION_TYPE' });
  const compositor = Deno.env.get('XDG_SESSION_TYPE');
  switch (compositor) {
    case 'x11':
      return 'linuxOnX';
    case'wayland':
      return 'linuxOnWayland';
    default:
      throw Error(`Unsupported compositor ${compositor}`);
  }
}

export async function writeToClipboard(data: string): Promise<number> {
  const os = Deno.build.os;
  const command = COMMANDS_BY_OS[ await computePlatform(os) ];
  await getPermissionOrExit({ name: 'run', command: command.programName });
  return command.writeText(data);
}
