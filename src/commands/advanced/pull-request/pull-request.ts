import log from '../../../dependencies/log.ts';
import { exists } from '../../../dependencies/fs.ts';
import { resolve } from '../../../dependencies/path.ts';
import { isEmpty, size } from '../../../dependencies/ramda.ts';
import { stoyle, stoyleGlobal, theme } from '../../../dependencies/stoyle.ts';
import { promptConfirm, promptSelect, promptString } from '../../../dependencies/cliffy.ts';
import {
  bindOptionsAndCreateUsage, toYargsUsage, ExtraPermissions, YargsOptions, toYargsCommand, YargsInstance,
} from '../../../dependencies/yargs.ts';

import { editText } from '../../../lib/editText.ts';
import { readTextFile } from '../../../lib/readTextFile.ts';
import { writeToClipboard } from '../../../lib/clipboard.ts';
import { DEFAULT_REMOTE } from '../../../lib/git/remotes.ts';
import { openInDefaultApplication } from '../../../lib/open.ts';
import { getBranchRemote } from '../../../lib/git/getBranchRemote.ts';
import { getParentBranch } from '../../../lib/branch/getParentBranch.ts';
import { parseBranchName } from '../../../lib/branch/parseBranchName.ts';
import { stringifyBranch } from '../../../lib/branch/stringifyBranch.ts';
import { getCommitsUpToMax } from '../../../lib/git/getCommitsUpToMax.ts';
import { getDiffBetweenRefs } from '../../../lib/git/getDiffBetweenRefs.ts';
import { getCurrentBranchName } from '../../../lib/git/getCurrentBranchName.ts';
import { getCommitsBetweenRefs } from '../../../lib/git/getCommitsBetweenRefs.ts';
import { getRepositoryFromRemote } from '../../../lib/git/getRepositoryFromRemote.ts';

import { github } from './reviewTools/Github.ts';
import { PullRequestCreation, ReviewTool } from './ReviewTool.ts';

import { thrust } from '../../simple/thrust.ts';
import { parseDiffAndDisplay } from '../../simple/audit.ts';
import { FullGutConfiguration } from '../../../configuration.ts';

async function promptForPrTitle (commitsNumber: number): Promise<string> {
  const tenLastCommits = await getCommitsUpToMax(commitsNumber, false);
  const titleOptions = tenLastCommits
    .map(({ subject }) => subject)
    .map((subject, index) => ({
      name: `${index + 1}: ${subject}`,
      value: subject,
    }));

  const title = await promptSelect({
    message: 'Select the title for your PR from the options or write a new one',
    options: [
      ...titleOptions,
      { name: '📃 Write title', value: '📃' },
    ],
    maxRows: 11,
    search: true,
  });

  if (title !== '📃') { return title; }

  return promptString({
    message: 'Write the title for your PR',
    minLength: 10,
  });
}

async function promptForPrDescription (tempDescriptionFile: string, descriptionTemplate?: string): Promise<string> {
  const shouldWriteDescription = await promptConfirm({
    message: 'Do you want to write a description?',
    default: !!descriptionTemplate,
  });

  if (!shouldWriteDescription) { return ''; }

  return editText({
    fileType: 'markdown',
    startTemplate: descriptionTemplate,
    outputFilePath: tempDescriptionFile,
  });
}

interface Args {
  open: boolean,
  copyUrl: boolean,
  remote?: string,
  assignee?: string,
  baseBranch?: string,
  configuration: FullGutConfiguration,

  // Test thingies
  isTestRun: boolean,
}

const PR_DESCRIPTION_FILE_NAME = 'pr-description.md';
const ARG_OPEN = 'open';
const ARG_COPY = 'copy-url';

export const baseCommand = 'pull-request';
export const describe = 'Creates a pull request on your git server';
export const options: YargsOptions = {
  [ ARG_OPEN ]: {
    alias: 'o',
    describe: 'Open the PR in the system\'s default browser',
    type: 'boolean',
  },
  [ ARG_COPY ]: {
    alias: 'c',
    describe: 'Copies the PR\'s URL to the system\'s clipboard.',
    type: 'boolean',
  },
  assignee: {
    alias: 'a',
    describe: 'Sets the PR\'s assignee, defaults to the creator',
    type: 'string',
  },
  'base-branch': {
    alias: 'b',
    describe: 'Define the base branch on which the PR will be created manually. Defaults to the parent branch',
    type: 'string',
  },
  remote: {
    alias: 'r',
    describe: 'The remote on which the PR will be done',
    type: 'string',
    default: DEFAULT_REMOTE.name,
  },
};
export const command = toYargsCommand(baseCommand, options);
export const aliases = [ 'pr' ];
export const usage = toYargsUsage(baseCommand, options);
export const extraPermissions: ExtraPermissions = {
  '--allow-run': {
    value: [
      '`powershell,explorer` (Windows)',
      '`pbcopy,open` (Mac)',
      '`xclip,xfg-open` (Linux)',
    ].join('<br>'),
    description: [
      // '',
      `Allows:<ul><li>Writing the PR's URL to the clipboard when \`--${ARG_COPY}\` is set</li>`,
      `<li>Opening the PR's URL with the default browser when \`--${ARG_OPEN}\` is set</li></ul>`,
    ].join('<br>'),
  },
};

const findBaseBranch = async (currentBranchName: string, baseBranchNameFromCli?: string): Promise<string> => {
  if (baseBranchNameFromCli) { return baseBranchNameFromCli; }

  const currentBranch = parseBranchName(currentBranchName);
  const parentBranch = getParentBranch(currentBranch);

  return stringifyBranch(parentBranch);
};

export async function builder (yargs: YargsInstance) {
  return bindOptionsAndCreateUsage(yargs, usage, options);
}

export async function handler (args: Args) {
  const {
    open, copyUrl, assignee, baseBranch, remote,
    configuration,
  } = args;

  const currentBranchName = await getCurrentBranchName();
  const baseBranchName = await findBaseBranch(currentBranchName, baseBranch);
  const commitsInPr = await getCommitsBetweenRefs(baseBranchName, currentBranchName, false);

  if (isEmpty(commitsInPr)) {
    const message = stoyleGlobal`There are no commits added from the base branch, aborting.\n'`(theme.warning);
    await log(Deno.stdout, message);
    Deno.exit(1);
  }

  const commitsNumber = size(commitsInPr);
  await log(Deno.stdout, stoyle`Auditing ${commitsNumber.toString()} commit(s)\n`(
    { nodes: [ theme.commitsNumber ] },
  ));

  const diff = await getDiffBetweenRefs(baseBranchName, currentBranchName);
  await parseDiffAndDisplay(diff);
  await log(Deno.stdout, '\n');

  const shouldGoOn = await promptConfirm({
    message: 'Do you want to create a PR for this branch ?',
    default: true,
  });

  if (!shouldGoOn) {
    await log(Deno.stdout, 'Operation aborted');
    Deno.exit(0);
  }

  const title = await promptForPrTitle(commitsNumber);
  const reviewTool: ReviewTool = github; // TODO: allow changing this from configuration

  const tempDescriptionFile = resolve(configuration.global.tempFolderPath, PR_DESCRIPTION_FILE_NAME);
  const descriptionTemplate = await exists(tempDescriptionFile)
    ? await readTextFile(tempDescriptionFile, {}) // In case previous PR try failed
    : await reviewTool.retrievePullRequestTemplate();
  const description = await promptForPrDescription(tempDescriptionFile, descriptionTemplate);

  if (!await getBranchRemote()) {
    await log(Deno.stdout, stoyleGlobal`The branch was never pushed, pushing it now\n`(theme.strong));
    await thrust(false);
  }

  const { owner: originOwner } = await getRepositoryFromRemote();
  const { owner: repositoryOwner, name: repositoryName } = await getRepositoryFromRemote(remote);
  const reviewToolConfiguration = configuration.global.tools?.github; // TODO: allow changing this from configuration
  const username = reviewToolConfiguration?.account?.username;
  const token = reviewToolConfiguration?.account?.password;

  if (!username || !token) {
    await log(Deno.stderr, stoyleGlobal`No valid account found for git server: github'`(theme.error));
    Deno.exit(1);
  }

  const pullRequestCreation: PullRequestCreation = {
    originOwner,
    repositoryOwner,
    repositoryName,
    title,
    description,
    currentBranchName,
    baseBranchName,
    assignee: assignee || username,
  };
  const { url: prUrl } = await reviewTool.createPullRequest(pullRequestCreation, token);

  if (copyUrl) { await writeToClipboard(prUrl); }

  if (open) { await openInDefaultApplication(prUrl); }

  await Deno.remove(tempDescriptionFile); // Only remove if PR was successfully created
}

export const test = {};
