import { getTopLevel } from './lib/git.ts';
import { resolve } from './dependencies/path.ts';
import { exists } from './dependencies/fs.ts';

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
  server?: {}, // TODO: implement
  ci?: {}, // TODO: implement
  messaging?: {}, // TODO: implement
}

export interface GlobalGutConfiguration {
  tools: { [ key: string ]: Tool },
  preferredGitServer: string, // A key to a tool with server facet
  repositoriesPath: string,
  editor: string,
}

export interface RepositoryGutConfiguration {
  reviewTool: string, // A key to a tool with review facet in global configuration
  shouldUseEmojis: boolean,
}

export interface FullGutConfiguration {
  global: GlobalGutConfiguration,
  repository?: RepositoryGutConfiguration,
}

export const CONFIGURATION_FILE_NAME = '.gut-config.json';
export const FORGE_PATH = '/home/cyp/Restlet/forge';

export async function getConfiguration (): Promise<FullGutConfiguration> {
  const globalConfigurationPath = resolve(FORGE_PATH, CONFIGURATION_FILE_NAME);
  const globalConfigurationAsJson = await Deno.readTextFile(globalConfigurationPath); // TODO: handle no configuration file
  const globalConfiguration = JSON.parse(globalConfigurationAsJson) as GlobalGutConfiguration;

  const currentRepositoryTopLevel = await getTopLevel();
  if (!currentRepositoryTopLevel) { return { global: globalConfiguration }; }
  const repositoryConfigurationPath = resolve(currentRepositoryTopLevel, CONFIGURATION_FILE_NAME);

  if (await exists(repositoryConfigurationPath)) {
    const repositoryConfigurationAsJson = await Deno.readTextFile(repositoryConfigurationPath);
    const repositoryConfiguration = JSON.parse(repositoryConfigurationAsJson) as RepositoryGutConfiguration;

    return {
      global: globalConfiguration,
      repository: repositoryConfiguration,
    };
  }

  return { global: globalConfiguration };
}
