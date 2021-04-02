import { FullGutConfiguration } from '../../configuration.ts';

import log from '../../dependencies/log.ts';
import { path } from '../../dependencies/ramda.ts';
import { resolve } from '../../dependencies/path.ts';
import { __, applyStyle, theme } from '../../dependencies/colors.ts';
import { executeProcessCriticalTask } from '../../lib/exec/executeProcessCriticalTask.ts';

interface Args {
  configuration: FullGutConfiguration,

  server?: string,
  owner?: string,
  repository: string,

  // Test thingies
  isTestRun: boolean,
}

export const command = 'replicate';
export const aliases = [ 'r' ];
export const describe = 'Clones a repository';

interface GitServer {
  getSshUrl: (owner: string, repository: string) => string,
}

interface RepositoryMetadata {
  sshUrl: string,
  server: string,
  owner: string,
  repository: string,
}

const GIT_SERVERS: { [ key: string ]: GitServer } = { // TODO: get custom servers from gut-config
  github: {
    getSshUrl (owner, repository): string {
      return `git@github.com:${owner}/${repository}.git`;
    },
  },
};

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
    throw Error(applyStyle(
      __`Server ${serverName} not configured. Please make sure it is not being implemented and create an issue.`,
      [ theme.strong ],
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

export async function builder (yargs: any) {
  return yargs.usage('usage: gut replicate [options]')
    .option('server', {
      alias: 's',
      describe: 'The git server where the repository is.',
      type: 'string',
      choices: Object.keys(GIT_SERVERS),
    })
    .option('owner', {
      alias: 'o',
      describe: 'The owner of the repository to be cloned.',
      type: 'string',
    })
    .option('repository', {
      alias: 'r',
      describe: 'The name of the repository to be cloned.',
      type: 'string',
      demandOption: true,
    });
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
