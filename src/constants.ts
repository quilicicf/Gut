import { resolve } from './dependencies/path.ts';

interface Constants {
  HOME_DIR: string;
  CONFIGURATION_FILE_NAME: string;
  GUT_CONFIGURATION_FOLDER: string;
}

const constants: Constants = {
  HOME_DIR: '',
  CONFIGURATION_FILE_NAME: '',
  GUT_CONFIGURATION_FOLDER: '',
};

export async function getConstants (): Promise<Constants> {
  if (!constants.CONFIGURATION_FILE_NAME) {
    constants.HOME_DIR = Deno.env.get('HOME') || '';
    constants.CONFIGURATION_FILE_NAME = '.gut-config.json';
    constants.GUT_CONFIGURATION_FOLDER = resolve(constants.HOME_DIR, '.config', 'gut');
  }

  return constants;
}
