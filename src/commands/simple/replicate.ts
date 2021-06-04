import log from '../../dependencies/log.ts';
import { path } from '../../dependencies/ramda.ts';
import { resolve } from '../../dependencies/path.ts';
import { stoyle, theme } from '../../dependencies/stoyle.ts';
import {
  bindOptionsAndCreateUsage, toYargsUsage, toYargsCommand, ExtraPermissions, YargsOptions,
} from '../../dependencies/yargs.ts';

import { getConstants } from '../../constants.ts';
import { FullGutConfiguration } from '../../configuration.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';

interface Args {
  configuration: FullGutConfiguration,

  server?: string,
  owner?: string,
  repository: string,

  // Test thingies
  isTestRun: boolean,
}

interface RepositoryMetadata {
  sshUrl: string,
  server: string,
  owner: string,
  repository: string,
}

const { GIT_SERVERS } = await getConstants();

const buildGitSshUrl = (args: Args): RepositoryMetadata => {
  const {
    configuration: {
      global: globalConfiguration,
    },
    server, owner, repository,
  } = args;

  const serverName = server || globalConfiguration.preferredGitServer;
  const gitServer = GIT_SERVERS[ serverName ];

  if (!gitServer) {
    throw Error(stoyle`Server ${serverName} not configured. Please make sure it is not being implemented and create an issue.`(
      { nodes: [ theme.strong ] },
    ));
  }

  const ownerName = owner || path(
    [ 'tools', serverName, 'account', 'username' ],
    globalConfiguration,
  );

  if (!ownerName) {
    throw Error('Cannot replicate a repository without owner');
  }

  return {
    sshUrl: gitServer.getSshUrl(ownerName, repository),
    server: serverName,
    owner: ownerName,
    repository,
  };
};

export const baseCommand = 'replicate';
export const aliases = [ 'r' ];
export const describe = 'Clones a repository';
export const options: YargsOptions = {
  server: {
    alias: 's',
    describe: 'The git server where the repository is, defaults to the preferred git server from global configuration file',
    type: 'string',
    choices: Object.keys(GIT_SERVERS),
  },
  owner: {
    alias: 'o',
    describe: 'The owner of the repository to be cloned.',
    type: 'string',
  },
  repository: {
    alias: 'r',
    describe: 'The name of the repository to be cloned.',
    type: 'string',
    demandOption: true,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export async function builder (yargs: any) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler (args: Args) {
  const { configuration, isTestRun } = args;
  const {
    server, owner, repository, sshUrl,
  } = buildGitSshUrl(args);
  const repositoryPath = resolve(configuration.global.forgePath, server, owner, repository);

  if (!isTestRun) {
    await log(Deno.stdout, `Cloning ${sshUrl} into ${repositoryPath}\n`);
  }

  await executeProcessCriticalTask([ 'git', 'clone', sshUrl, repositoryPath ]);
}

export const test = { buildGitSshUrl };
