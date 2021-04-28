import { DEFAULT_REMOTE } from './remotes.ts';

export async function getRepositoryFromRemote (remote: string = DEFAULT_REMOTE.name) {
  const process = Deno.run({
    cmd: [ 'git', 'remote', 'show', '-n', remote ],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'null',
  });

  const remoteDescription = await process.output();
  process.close();

  const remoteDescriptionAsString = new TextDecoder().decode(remoteDescription);
  const regex = /^[ ]+Fetch URL: git@[^:]+:([^/]+)\/(.*?)\.git$/m;
  const [ , owner, name ] = regex.exec(remoteDescriptionAsString) || [];
  return {
    owner: owner || '',
    name: name || '',
  };
}
