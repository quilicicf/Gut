import { applyStyle, theme } from '../../dependencies/colors.ts';
import log from '../../dependencies/log.ts';
import { promptConfirm, ConfirmOptions } from '../../dependencies/cliffy.ts';

import { findRemote } from '../../lib/git/remotes.ts';

interface Args {
  remote?: string,
  tag?: string,
  branch?: string,
  assumeYes?: boolean,

  // Test thingies
  isTestRun: boolean,
}

export const command = 'obliterate';
export const aliases = [ 'o' ];
export const describe = 'Deletes a branch or a tag';

export function builder (yargs: any) {
  return yargs.usage(`usage: gut ${command} [options]`)
    .option('branch', {
      alias: 'b',
      describe: 'The branch to delete',
      type: 'string',
      conflicts: 'tag',
    })
    .option('tag', {
      alias: 't',
      describe: 'The tag to delete',
      type: 'string',
      conflicts: 'branch',
    })
    .option('remote', {
      alias: 'r',
      describe: 'The remote where the item should be deleted. Leave empty to delete the item locally.',
      type: 'string',
    })
    .option('assume-yes', {
      alias: 'y',
      describe: 'Does not show confirmation before deleting. To be used with caution.',
      type: 'boolean',
      default: false,
    })
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
