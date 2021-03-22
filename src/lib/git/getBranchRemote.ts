export async function getBranchRemote (): Promise<string | undefined> {
  try {
    const output = await Deno.run({
      cmd: [ 'git', 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}' ],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'null',
    }).output();

    const fullBranchName = new TextDecoder().decode(output);
    return fullBranchName.split('/')?.[ 0 ];
  } catch (error) {
    return undefined;
  }
}
