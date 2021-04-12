import { resolve } from './dependencies/path.ts';
import { exists } from './dependencies/fs.ts';

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
  const globalConfigurationPath = resolve(GUT_CONFIGURATION_FOLDER, CONFIGURATION_FILE_NAME);
  const globalConfigurationAsJson = await Deno.readTextFile(globalConfigurationPath); // TODO: no configuration file?
  const globalConfiguration: GlobalGutConfiguration = JSON.parse(globalConfigurationAsJson);

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
