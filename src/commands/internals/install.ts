import log from '../../dependencies/log.ts';
import { resolve, fromFileUrl } from '../../dependencies/path.ts';

import { getConstants } from '../../constants.ts';
import { __, applyStyle, theme } from '../../dependencies/colors.ts';

const importScript = `\
# Installation of Gut scripts, see https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md#shell-features
# If the link is broken, you probably want to read the README again https://github.com/quilicicf/Gut/blob/master/README.md
if test -s ~/.config/gut/gut_shell_features.sh; then
  source "$_"
fi
`;

const retrieveShellScript = async (urlToScript: URL): Promise<string> => {
  if (urlToScript.protocol === 'file:') {
    const scriptFilePath = fromFileUrl(urlToScript);
    return Deno.readTextFile(scriptFilePath);
  }

  if (/^http(s)?:/.test(urlToScript.protocol)) {
    const response = await fetch(urlToScript.toString());
    if (response.status < 300 && response.status > 199) {
      return response.text();
    }
  }

  throw Error(`Can't retrieve the shell features script from ${urlToScript.toString()}`);
};

const installShellFeatures = async () => {
  const shellScriptName = 'gut_shell_features.sh';
  const urlToScript = new URL(`../../../shell/${shellScriptName}`, import.meta.url);
  const initialShellScript = await retrieveShellScript(urlToScript);

  const { GUT_CONFIGURATION_FOLDER } = await getConstants();
  const targetShellScriptPath = resolve(GUT_CONFIGURATION_FOLDER, shellScriptName);

  await Deno.writeTextFile(targetShellScriptPath, initialShellScript);

  await log(Deno.stdout, [
    applyStyle(__`Copying the shell features in ${targetShellScriptPath}`, [ theme.fileName ]),
    applyStyle('Installation almost complete, now copy the following to your ~/.bashrc or equivalent:', [ theme.strong ]),
    '',
    importScript,
    applyStyle(__`💡 You'll need to run ${'exec bash'} or open a new terminal to test it`, [ theme.strong ]),
    '',
  ].join('\n'));
};

export default {
  command: 'install',
  aliases: [ 'i' ],
  describe: 'Installs gut',
  builder: () => {},
  handler: async () => {
    await installShellFeatures();
  },
};
