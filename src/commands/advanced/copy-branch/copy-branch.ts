import {
  ExtraPermissions, YargsOptions,
  bindOptionsAndCreateUsage, toYargsCommand, toYargsUsage, YargsInstance,
} from '../../../dependencies/yargs.ts';

import { getCurrentBranchName } from '../../../lib/git/getCurrentBranchName.ts';
import { writeToClipboard } from '../../../lib/clipboard.ts';

export const baseCommand = 'copy-branch';
export const aliases = [ 'cb' ];
export const describe = 'Copies the current branch name in the clipboard';
export const options: YargsOptions = {};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {
  '--allow-run': {
    value: [
      '`powershell` (Windows)',
      '`pbcopy` (Mac)',
      '`xclip` (Linux)',
    ].join('<br>'),
    description: 'Allows writing the current branch\'s name to the clipboard',
  },
};

export function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler () {
  const currentBranchName = await getCurrentBranchName();
  await writeToClipboard(currentBranchName);
}
