import log from '../../dependencies/log.ts';
import { stoyle, stoyleGlobal, theme } from '../../dependencies/stoyle.ts';
import { resolve, fromFileUrl } from '../../dependencies/path.ts';
import {
  bindOptionsAndCreateUsage, toYargsUsage, toYargsCommand, ExtraPermissions, YargsOptions, YargsInstance,
} from '../../dependencies/yargs.ts';

import { request } from '../../lib/request.ts';
import { readTextFile } from '../../lib/readTextFile.ts';
import { writeTextFile } from '../../lib/writeTextFile.ts';

import { getConstants } from '../../constants.ts';

const SHELL_SCRIPT_NAME = 'shell-features.sh';

interface Args {
  installName: string;
}

const importScript = (targetShellScriptPath: string) => `\
# Installation of Gut scripts, see https://github.com/quilicicf/Gut/#shell-features
if test -s ${targetShellScriptPath}; then
  source "$_"
fi
`;

const retrieveShellScript = async (urlToScript: URL): Promise<string> => {
  if (urlToScript.protocol === 'file:') {
    const scriptFilePath = fromFileUrl(urlToScript);
    return readTextFile(scriptFilePath, {});
  }

  if (/^http(s)?:/.test(urlToScript.protocol)) {
    const response = await request(urlToScript.toString());
    if (response.status < 300 && response.status > 199) {
      return response.text();
    }
  }

  throw Error(`Can't retrieve the shell features script from ${urlToScript.toString()}`);
};

const installShellFeatures = async (installName: string) => {
  const urlToScript = new URL(`../../../shell/${SHELL_SCRIPT_NAME}`, import.meta.url);
  const initialShellScript = await retrieveShellScript(urlToScript);
  const shellScriptWithGutNameSubstituted = initialShellScript
    .replace(/%GUT_NAME/g, installName);

  const { GUT_CONFIGURATION_FOLDER } = await getConstants();
  const targetShellScriptPath = resolve(GUT_CONFIGURATION_FOLDER, SHELL_SCRIPT_NAME);

  await writeTextFile(
    targetShellScriptPath,
    shellScriptWithGutNameSubstituted,
    { permissionPath: GUT_CONFIGURATION_FOLDER },
  );

  await log(Deno.stdout, [
    stoyle`Copying the shell features in ${targetShellScriptPath}`({ nodes: [ theme.fileName ] }),
    stoyleGlobal`Installation almost complete, now copy the following to your ~/.bashrc or equivalent:`(theme.strong),
    '',
    importScript(targetShellScriptPath),
    stoyle`💡 You'll need to run ${'exec bash'} or open a new terminal to test it`({ nodes: [ theme.strong ] }),
    '',
  ].join('\n'));
};

export const baseCommand = 'install';
export const aliases = [ 'i' ];
export const describe = 'Installs Gut shell features (by copying them in $HOME/.config/gut)';
export const options: YargsOptions = {
  'install-name': {
    alias: 'n',
    describe: 'The name you gave to Gut when installing it',
    type: 'string',
    default: 'gut',
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {
  '--allow-net': {
    value: '`raw.githubusercontent.com`',
    description: 'This permission allows Gut to retrieve the file containing the shell features from GitHub and write it in `~/.config/gut`',
  },
};

export function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler ({ installName }: Args) {
  await installShellFeatures(installName);
}
