/* eslint-disable indent */
import { applyStyle, theme } from '../../dependencies/colors.ts';
import { executeProcessCriticalTask } from '../exec/executeProcessCriticalTask.ts';

class Remote {
  name: string;

  argumentMatcher: (argument: string) => boolean;

  deleteBranchCommand: (branchToDelete: string) => Promise<void>;

  deleteTagCommand: (tagToDelete: string) => Promise<void>;

  constructor (name: string, argumentMatcher: (argument: string) => boolean,
               deleteBranchCommand: (branchToDelete: string) => Promise<void>,
               deleteTagCommand: (tagToDelete: string) => Promise<void>) {
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
      await executeProcessCriticalTask([ 'git', 'branch', '--delete', '--force', branchToDelete ]);
    },
    async (tagToDelete) => {
      await executeProcessCriticalTask([ 'git', 'tag', '--delete', tagToDelete ]);
    },
  ),
  new Remote(
    applyStyle('origin', [ theme.origin ]),
    (argument) => !argument || argument === 'o' || argument === 'origin',
    async (branchToDelete) => {
      await executeProcessCriticalTask([ 'git', 'push', 'origin', '--delete', branchToDelete ]);
    },
    async (tagToDelete) => {
      await executeProcessCriticalTask([ 'git', 'push', 'origin', '--delete', tagToDelete ]);
    },
  ),
  new Remote(
    applyStyle('upstream', [ theme.upstream ]),
    (argument) => !argument || argument === 'u' || argument === 'upstream',
    async (branchToDelete) => {
      await executeProcessCriticalTask([ 'git', 'push', 'upstream', '--delete', branchToDelete ]);
    },
    async (tagToDelete) => {
      await executeProcessCriticalTask([ 'git', 'push', 'upstream', '--delete', tagToDelete ]);
    },
  ),
];

function findRemote (argument: string): Remote | undefined {
  return REMOTES.find((remote) => remote.argumentMatcher(argument));
}

export { REMOTES, findRemote };
