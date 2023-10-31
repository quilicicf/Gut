/* eslint-disable indent */
import { stoyleGlobal, theme } from '../../dependencies/stoyle.ts';
import { executeProcessCriticalTask } from '../exec/executeProcessCriticalTask.ts';

async function deleteRemoteBranch (remote: string, branch: string) {
  await executeProcessCriticalTask('git', [ 'push', remote, '--delete', branch ]);
}

async function deleteRemoteTag (remote: string, tag: string) {
  await executeProcessCriticalTask('git', [ 'push', remote, '--delete', tag ]);
}

class Remote {
  name: string;

  coloredName: string;

  argumentMatcher: (argument: string) => boolean;

  deleteBranchCommand: (branchToDelete: string) => Promise<void>;

  deleteTagCommand: (tagToDelete: string) => Promise<void>;

  constructor (name: string, coloredName: string,
               argumentMatcher: (argument: string) => boolean,
               deleteBranchCommand: (branchToDelete: string) => Promise<void>,
               deleteTagCommand: (tagToDelete: string) => Promise<void>) {
    this.name = name;
    this.coloredName = coloredName;
    this.argumentMatcher = argumentMatcher;
    this.deleteBranchCommand = deleteBranchCommand;
    this.deleteTagCommand = deleteTagCommand;
  }
}

function createRemote (name: string, coloredName: string, argumentMatcher: (argument: string) => boolean): Remote {
  return new Remote(
    name,
    coloredName,
    argumentMatcher,
    async (branch) => deleteRemoteBranch(name, branch),
    async (tag) => deleteRemoteTag(name, tag),
  );
}

function createUnknownRemote (name: string): Remote {
  return new Remote(
    name,
    name,
    () => true,
    async (branch) => deleteRemoteBranch(name, branch),
    async (tag) => deleteRemoteTag(name, tag),
  );
}

export const LOCAL_REMOTE = new Remote(
  'local',
  stoyleGlobal`local`(theme.local),
  (argument) => !argument || argument === 'l' || argument === 'local',
  async (branchToDelete) => {
    await executeProcessCriticalTask('git', [ 'branch', '--delete', '--force', branchToDelete ]);
  },
  async (tagToDelete) => {
    await executeProcessCriticalTask('git', [ 'tag', '--delete', tagToDelete ]);
  },
);

export const DEFAULT_REMOTE = createRemote(
  'origin',
  stoyleGlobal`origin`(theme.origin),
  (argument) => !argument || argument === 'o' || argument === 'origin',
);

export const REMOTES: Remote[] = [
  LOCAL_REMOTE,
  DEFAULT_REMOTE,
  createRemote(
    'upstream',
    stoyleGlobal`upstream`(theme.upstream),
    (argument) => !argument || argument === 'u' || argument === 'upstream',
  ),
];

export function findRemote (argument: string): Remote {
  return REMOTES.find((remote) => remote.argumentMatcher(argument)) || createUnknownRemote(argument);
}
