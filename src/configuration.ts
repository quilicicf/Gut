import log from './dependencies/log.ts';
import { resolve } from './dependencies/path.ts';
import { ensureDir, exists } from './dependencies/fs.ts';
import { applyStyle, theme } from './dependencies/colors.ts';

import { getConstants } from './constants.ts';
import { getTopLevel } from './lib/git/getTopLevel.ts';

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

export interface GlobalGutConfiguration {
  tools: { [ key: string ]: Tool },
  preferredGitServer: string, // A key to a tool with server facet
  forgePath: string,
  tempFolderPath: string, // Used to create temporary files, i.e. for error/retry
}

export interface RepositoryGutConfiguration {
  reviewTool: string, // A key to a tool with review facet in global configuration
  shouldUseEmojis: boolean,
  shouldUseIssueNumbers: boolean,
}

export interface FullGutConfiguration {
  global: GlobalGutConfiguration,
  repository?: RepositoryGutConfiguration,
}

export async function getConfiguration (): Promise<FullGutConfiguration> {
  const { GUT_CONFIGURATION_FOLDER, CONFIGURATION_FILE_NAME } = await getConstants();
  await ensureDir(GUT_CONFIGURATION_FOLDER);

  const globalConfigurationPath = resolve(GUT_CONFIGURATION_FOLDER, CONFIGURATION_FILE_NAME);

  if (!await exists(globalConfigurationPath)) {
    await log(Deno.stderr, applyStyle(`No global configuration file found: ${globalConfigurationPath}`, [ theme.error ]));
    Deno.exit(1);
  }

  const globalConfigurationAsJson = await Deno.readTextFile(globalConfigurationPath); // TODO: no configuration file?
  const globalConfiguration: GlobalGutConfiguration = JSON.parse(globalConfigurationAsJson);

  const tempFolderPath = resolve(GUT_CONFIGURATION_FOLDER, 'temp');
  globalConfiguration.tempFolderPath = tempFolderPath;
  await ensureDir(tempFolderPath);

  const currentRepositoryTopLevel = await getTopLevel();
  if (!currentRepositoryTopLevel) { return { global: globalConfiguration }; }
  const repositoryConfigurationPath = resolve(currentRepositoryTopLevel, CONFIGURATION_FILE_NAME);

  if (await exists(repositoryConfigurationPath)) {
    const repositoryConfigurationAsJson = await Deno.readTextFile(repositoryConfigurationPath);
    const repositoryConfiguration: RepositoryGutConfiguration = JSON.parse(repositoryConfigurationAsJson);

    return {
      global: globalConfiguration,
      repository: repositoryConfiguration,
    };
  }

  return { global: globalConfiguration };
}
