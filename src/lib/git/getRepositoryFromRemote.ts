export async function getRepositoryFomRemote (remote: string = 'origin') {
  const remoteDescription = await Deno.run({
    cmd: [ 'git', 'remote', 'show', '-n', remote ],
    stdin: 'null',
    stdout: 'piped',
    stderr: 'null',
  }).output();

  const remoteDescriptionAsString = new TextDecoder().decode(remoteDescription);
  const regex = /^[ ]+Fetch URL: git@[^:]+:([^/]+)\/(.*?)\.git$/m;
  const [ , owner, name ] = regex.exec(remoteDescriptionAsString) || [];
  return {
    owner: owner || '',
    name: name || '',
  };
}
