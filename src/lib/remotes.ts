/* eslint-disable indent */
import { applyStyle, theme } from '../dependencies/colors.ts';
import { exec, OutputMode } from '../dependencies/exec.ts';

class Remote {
  name: string;

  argumentMatcher: (argument: string) => boolean;

  deleteBranchCommand: (branchToDelete: string) => Promise<string>;

  deleteTagCommand: (tagToDelete: string) => Promise<string>;

  constructor (name: string, argumentMatcher: (argument: string) => boolean,
               deleteBranchCommand: (branchToDelete: string) => Promise<string>,
               deleteTagCommand: (tagToDelete: string) => Promise<string>) {
    this.name = name;
    this.argumentMatcher = argumentMatcher;
    this.deleteBranchCommand = deleteBranchCommand;
    this.deleteTagCommand = deleteTagCommand;
  }
}

const REMOTES: Remote[] = [
  new Remote(
    applyStyle('local', [ theme.local ]),
    (argument) => !argument || argument === 'l' || argument === 'local',
    async (branchToDelete) => {
      const { output } = await exec(`git branch -D ${branchToDelete}`, { output: OutputMode.Capture });
      return output;
    },
    async (tagToDelete) => {
      const { output } = await exec(`git tag -d ${tagToDelete}`, { output: OutputMode.Capture });
      return output;
    },
  ),
  new Remote(
    applyStyle('origin', [ theme.origin ]),
    (argument) => !argument || argument === 'o' || argument === 'origin',
    async (branchToDelete) => {
      const { output } = await exec(`git push origin --delete ${branchToDelete}`, { output: OutputMode.Capture });
      return output;
    },
    async (tagToDelete) => {
      const { output } = await exec(`git push origin --delete ${tagToDelete}`, { output: OutputMode.Capture });
      return output;
    },
  ),
  new Remote(
    applyStyle('upstream', [ theme.upstream ]),
    (argument) => !argument || argument === 'u' || argument === 'upstream',
    async (branchToDelete) => {
      const { output } = await exec(`git push upstream --delete ${branchToDelete}`, { output: OutputMode.Capture });
      return output;
    },
    async (tagToDelete) => {
      const { output } = await exec(`git push upstream --delete ${tagToDelete}`, { output: OutputMode.Capture });
      return output;
    },
  ),
];

function findRemote (argument: string): Remote | undefined {
  return REMOTES.find((remote) => remote.argumentMatcher(argument));
}

export { REMOTES, findRemote };
