import log from '../../dependencies/log.ts';
import { basename } from '../../dependencies/path.ts';
import { promptSelect } from '../../dependencies/cliffy.ts';
import { walk, WalkOptions } from '../../dependencies/fs.ts';
import { __, applyStyle, theme } from '../../dependencies/colors.ts';

import { FullGutConfiguration } from '../../configuration.ts';
import { getRepositoryNameFromPath } from '../../lib/git/getRepositoryNameFromPath.ts';
import {
  bindOptionsAndCreateUsage, toYargsCommand, toYargsUsage, YargsOptions,
} from '../../dependencies/yargs.ts';

interface Args {
  search: string;
  configuration: FullGutConfiguration;
}

const writeResult = async (result: string) => log(Deno.stderr, result);

const shortenPathRelativeToForgePath = (path: string) => (/([^/]+\/[^/]+\/[^/]+)$/.exec(path) || [ '' ])[ 1 ];

const toOptions = (paths: string[], currentRepositoryPath: string) => paths
  .filter((path) => path !== currentRepositoryPath)
  .map((path) => ({
    name: shortenPathRelativeToForgePath(path),
    value: path,
  }));

export const baseCommand = 'cr';
export const options: YargsOptions = {
  search: {
    describe: 'Search text to filter the candidates',
    type: 'string',
    isPositionalOption: true,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const usage = toYargsUsage(baseCommand, options);
export const describe = false; // Un-documented command
export const aliases = [];

export function builder (yargs: any) {
  return bindOptionsAndCreateUsage(yargs, usage, options)
    .epilogue([
      applyStyle(__`Command used by the shell feature ${'cr'} to manage the interactive part.\n`, [ theme.strong ]),
      'This command is only called from the shell function because gut (being a child process) cannot change ',
      'the directory of the parent process.\n',
      'This command outputs its result on stderr to allow the shell caller not to interfere with stdout (used ',
      'for interactivity with the user) but still retrieve the result without having gut write to a file (this ',
      'would be annoying due to Deno permissions system and because I simply refuse to use --allow-all).',
    ].join(''));
}

export async function handler (args: Args) {
  const {
    search = '',
    configuration,
  } = args;

  const { forgePath } = configuration.global;
  const walkOptions: WalkOptions = {
    maxDepth: 4,
    includeFiles: false,
    match: [ /\.git$/ ],
  };

  const allCandidateRepositories = [];

  // eslint-disable-next-line no-restricted-syntax
  for await (const repositoryGitFolderPath of walk(forgePath, walkOptions)) {
    const candidateRepositoryPath = repositoryGitFolderPath.path.replace(/.\.git$/, '');
    allCandidateRepositories.push(candidateRepositoryPath);
  }

  const fullMatches = allCandidateRepositories
    .filter((path) => basename(path).toLocaleLowerCase() === search.toLocaleLowerCase());

  if (fullMatches.length === 1) { // Perfect match with search
    return writeResult(fullMatches[ 0 ]);
  }

  const directMatches = allCandidateRepositories
    .filter((path) => path.toLocaleLowerCase().includes(search.toLocaleLowerCase()));

  if (directMatches.length === 1) { // Only one candidate after search
    return writeResult(directMatches[ 0 ]);
  }

  const currentRepositoryPath = await getRepositoryNameFromPath();
  const targetPath = await promptSelect({
    message: 'Select the repository to cd to:',
    options: toOptions(directMatches, currentRepositoryPath),
    maxRows: 10,
    search: true,
  });

  return writeResult(targetPath);
}
