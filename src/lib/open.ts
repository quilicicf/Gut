const programAliases = {
  windows: 'explorer', // Does that work?
  darwin: 'open',
  linux: 'xdg-open',
};

export async function openInDefaultApplication (urlOrPath: string): Promise<number> {
  const { code } = await Deno.run({
    cmd: [ programAliases[ Deno.build.os ], urlOrPath ],
  }).status();
  return code;
}
