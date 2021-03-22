import { resolve } from './dependencies/path.ts';
import { exists } from './dependencies/fs.ts';
import { exec, OutputMode } from './dependencies/exec.ts';

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

export const CONFIGURATION_FILE_NAME = '.gut-config.json';

export async function getConfiguration (): Promise<FullGutConfiguration> {
  const { output: user } = await exec('whoami', { output: OutputMode.Capture });
  const globalConfigurationPath = resolve('/home', user, '.config', 'gut', CONFIGURATION_FILE_NAME);
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
