import log from '../../dependencies/log.ts';
import { applyStyle, theme } from '../../dependencies/colors.ts';
import { promptConfirm, ConfirmOptions } from '../../dependencies/cliffy.ts';
import {
  bindOptionsAndCreateUsage, toYargsUsage, toYargsCommand, ExtraPermissions, YargsOptions,
} from '../../dependencies/yargs.ts';

import { findRemote } from '../../lib/git/remotes.ts';

interface Args {
  remote?: string,
  tag?: string,
  branch?: string,
  assumeYes?: boolean,

  // Test thingies
  isTestRun: boolean,
}

const ARG_TAG = 'tag';
const ARG_BRANCH = 'branch';

export const baseCommand = 'obliterate';
export const aliases = [ 'o' ];
export const describe = 'Deletes a branch or a tag';
export const options: YargsOptions = {
  [ ARG_BRANCH ]: {
    alias: 'b',
    describe: 'The branch to delete',
    type: 'string',
    conflicts: [ ARG_TAG ],
  },
  [ ARG_TAG ]: {
    alias: 't',
    describe: 'The tag to delete',
    type: 'string',
    conflicts: [ ARG_BRANCH ],
  },
  remote: {
    alias: 'r',
    describe: 'The remote where the item should be deleted. Leave empty to delete the item locally.',
    type: 'string',
  },
  'assume-yes': {
    alias: 'y',
    describe: 'Does not show confirmation before deleting. To be used with caution.',
    type: 'boolean',
    default: false,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {};

export function builder (yargs: any) {
  return bindOptionsAndCreateUsage(yargs, usage, options)
    .check((currentArguments: Args) => {
      if (!currentArguments.branch && !currentArguments.tag) {
        throw Error(applyStyle('You must specify the branch/tag you want to delete', [ theme.error ]));
      }

      return true;
    });
}

export async function handler (args: Args) {
  const {
    remote = 'local',
    tag,
    branch,
    assumeYes,

    isTestRun,
  } = args;

  const targetRemote = findRemote(remote);

  if (!targetRemote) {
    throw Error(`No remote found for argument: '${remote}'`);
  }

  const itemName = branch ? 'branch' : 'tag';
  const itemToDelete = branch || tag;

  const question: ConfirmOptions = {
    message: `Delete ${itemName} ${itemToDelete} on ${targetRemote.name}?`,
    default: false,
  };

  const shouldProceed = assumeYes || await promptConfirm(question);

  if (!shouldProceed) {
    await log(Deno.stdout, 'Operon aborted');
    return '';
  }

  if (branch) {
    return isTestRun
      ? `Deleting branch ${branch}`
      : targetRemote.deleteBranchCommand(branch);
  }

  if (tag) {
    return isTestRun
      ? `Deleting tag ${tag}`
      : targetRemote.deleteTagCommand(tag);
  }

  return '';
}

export const test = {};
