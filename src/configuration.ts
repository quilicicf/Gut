import { resolve } from './dependencies/path.ts';
import { exists } from './dependencies/fs.ts';

import { getTopLevel } from './lib/git/getTopLevel.ts';
import { executeAndGetStdout } from './lib/exec/executeAndGetStdout.ts';

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

export const CONFIGURATION_FILE_NAME = '.gut-config.json';

export async function getConfiguration (): Promise<FullGutConfiguration> {
  const user = await executeAndGetStdout([ 'whoami' ], true);
  const globalConfigurationPath = resolve('/home', user, '.config', 'gut', CONFIGURATION_FILE_NAME);
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
