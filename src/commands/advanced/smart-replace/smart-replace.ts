import {
  ExtraPermissions, YargsOptions,
  bindOptionsAndCreateUsage, toYargsCommand, toYargsUsage,
} from '../../../dependencies/yargs.ts';

import { getConstants } from '../../../constants.ts';
import { createWorker } from '../../../lib/threadPool.ts';

// noinspection ES6UnusedImports
import dummyWorker from './worker.ts'; // Unused statement, used to make Deno download the file at installation
import { resolve } from '../../../dependencies/path.ts';
import { FullGutConfiguration } from '../../../configuration.ts';

const { GIT_SERVERS } = await getConstants();

interface Args {
  configuration: FullGutConfiguration,

  server?: string,
  owner: string,
}

export const baseCommand = 'smart-replace';
export const aliases = [ 'sr' ];
export const describe = 'Applies substitutions in all the repositories of an owner';
export const options: YargsOptions = {
  server: {
    alias: 's',
    describe: 'The git server of the owner to process, defaults to the preferred git server from global configuration file',
    type: 'string',
    choices: Object.keys(GIT_SERVERS),
    requiresArg: true,
  },
  owner: {
    alias: 'o',
    describe: 'The owner to process',
    type: 'string',
    demandOption: true,
    requiresArg: true,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: any) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler (args: Args) {
  const {
    configuration,
    server: serverArg,
    owner,
  } = args;

  const server: string = serverArg || configuration.global.preferredGitServer;
  const ownerPath = resolve(configuration.global.forgePath, server, owner);

  const worker = createWorker(new URL('./worker.ts', import.meta.url).href);
  for await (const repositoryPath of Deno.readDir(ownerPath)) {
    worker.postMessage({ repositoryPath });
    worker.onmessage = ({ data: { message } }: MessageEvent) => console.log(message);
  }
  worker.terminate();
}
