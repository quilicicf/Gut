import { DEFAULT_REMOTE } from './remotes.ts';

export async function getRepositoryFromRemote (remote: string = DEFAULT_REMOTE.name) {
  const process = new Deno.Command(
    'git',
    {
      args: [ 'remote', 'show', '-n', remote ],
      stdin: 'null',
      stdout: 'piped',
      stderr: 'null',
    },
  ).spawn();

  const { stdout: remoteDescription } = await process.output();

  const remoteDescriptionAsString = new TextDecoder().decode(remoteDescription);
  const regex = /^[ ]+Fetch URL: git@[^:]+:([^/]+)\/(.*?)\.git$/m;
  const [ , owner, name ] = regex.exec(remoteDescriptionAsString) || [];
  return {
    owner: owner || '',
    name: name || '',
  };
}
