import { resolve } from './dependencies/path.ts';

import { getPermissionOrExit } from './lib/getPermissionOrExit.ts';

interface GitServer {
  getSshUrl: (owner: string, repository: string) => string,
}

interface Constants {
  HOME_DIR: string;
  CONFIGURATION_FILE_NAME: string;
  GUT_CONFIGURATION_FOLDER: string;
  GIT_SERVERS: { [ key: string ]: GitServer };
}

const constants: Constants = {
  HOME_DIR: '',
  CONFIGURATION_FILE_NAME: '',
  GUT_CONFIGURATION_FOLDER: '',
  GIT_SERVERS: { // TODO: get custom servers from gut-config
    github: {
      getSshUrl (owner, repository): string {
        return `git@github.com:${owner}/${repository}.git`;
      },
    },
  },
};

export async function getConstants (): Promise<Constants> {
  if (!constants.CONFIGURATION_FILE_NAME) {
    await getPermissionOrExit({ name: 'env', variable: 'HOME' });
    constants.HOME_DIR = Deno.env.get('HOME') || '';
    constants.CONFIGURATION_FILE_NAME = '.gut-config.json';
    constants.GUT_CONFIGURATION_FOLDER = resolve(constants.HOME_DIR, '.config', 'gut');
  }

  return constants;
}
