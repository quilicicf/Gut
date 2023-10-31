import { resolve } from './dependencies/path.ts';
import { ensureDir, exists } from './dependencies/fs.ts';

import { getTopLevel } from './lib/git/getTopLevel.ts';
import { readTextFile } from './lib/readTextFile.ts';

import { getConstants } from './constants.ts';
import { getPermissionOrExit } from './lib/getPermissionOrExit.ts';
import { mergeDeepRight, set } from './dependencies/ramda.ts';

export interface Account {
  username: string,
  password: string,
  // password: { // TODO: encrypt password
  //   crypt: string,
  //   iv: string,
  // },
}

export interface Tool {
  account: Account,
}

export interface Executable {
  command: string,
  args: string[],
}

export interface GlobalGutConfiguration {
  tools: { [ key: string ]: Tool },
  preferredGitServer: string, // A key to a tool with server facet
  forgePath: string,
  tempFolderPath: string, // Used to create temporary files, i.e. for error/retry
  browser?: Executable
}

export type MessageFormat = 'standard' | 'emoji' | 'angular'
export const DEFAULT_MESSAGE_FORMAT: MessageFormat = 'emoji';

export interface RepositoryGutConfiguration {
  reviewTool: string, // A key to a tool with review facet in global configuration
  messageFormat: MessageFormat,
  shouldUseIssueNumbers: boolean,
}

export interface FullGutConfiguration {
  global: GlobalGutConfiguration,
  repository?: RepositoryGutConfiguration,
}

async function readRepositoryConfiguration (repositoryConfigurationPath: string) {
  if (!await exists(repositoryConfigurationPath)) {
    return {};
  }

  const repositoryConfigurationAsJson = await readTextFile(repositoryConfigurationPath, {});
  const repositoryConfiguration: RepositoryGutConfiguration = JSON.parse(repositoryConfigurationAsJson);
  if (!repositoryConfiguration.messageFormat) {
    set(repositoryConfiguration, [ 'messageFormat' ], DEFAULT_MESSAGE_FORMAT);
  }

  return repositoryConfiguration;
}

export async function getConfiguration (): Promise<FullGutConfiguration> {
  const { GUT_CONFIGURATION_FOLDER, CONFIGURATION_FILE_NAME } = await getConstants();

  await getPermissionOrExit({ name: 'read', path: GUT_CONFIGURATION_FOLDER });
  await ensureDir(GUT_CONFIGURATION_FOLDER);

  const globalConfigurationPath = resolve(GUT_CONFIGURATION_FOLDER, CONFIGURATION_FILE_NAME);

  const globalConfigurationAsJson = await exists(globalConfigurationPath)
    ? await readTextFile(globalConfigurationPath, { permissionPath: GUT_CONFIGURATION_FOLDER })
    : '{}'; // TODO: make sure forge path is added at first run or you're screwed
  const globalConfiguration: GlobalGutConfiguration = JSON.parse(globalConfigurationAsJson);

  const tempFolderPath = resolve(GUT_CONFIGURATION_FOLDER, 'temp');
  globalConfiguration.tempFolderPath = tempFolderPath;
  await ensureDir(tempFolderPath);

  await getPermissionOrExit({ name: 'read', path: globalConfiguration.forgePath });
  const currentRepositoryTopLevel = await getTopLevel();

  if (!currentRepositoryTopLevel || !currentRepositoryTopLevel.startsWith(globalConfiguration.forgePath)) {
    return { global: globalConfiguration };
  }

  const publicRepositoryConfigurationPath = resolve(currentRepositoryTopLevel, CONFIGURATION_FILE_NAME);
  const publicRepositoryConfiguration = await readRepositoryConfiguration(publicRepositoryConfigurationPath);

  const privateRepositoryConfigurationPath = resolve(currentRepositoryTopLevel, '.git', CONFIGURATION_FILE_NAME);
  const privateRepositoryConfiguration = await readRepositoryConfiguration(privateRepositoryConfigurationPath);

  const repositoryConfiguration = mergeDeepRight(publicRepositoryConfiguration, privateRepositoryConfiguration);

  return {
    global: globalConfiguration,
    repository: repositoryConfiguration,
  };
}
