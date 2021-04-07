import log from '../../../dependencies/log.ts';
import { isEmpty, size } from '../../../dependencies/ramda.ts';
import { __, applyStyle, theme } from '../../../dependencies/colors.ts';
import { promptConfirm, promptSelect, promptString } from '../../../dependencies/cliffy.ts';

import { editText } from '../../../lib/editText.ts';
import { writeToClipboard } from '../../../lib/clipboard.ts';
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

async function promptForPrDescription (descriptionTemplate?: string): Promise<string> {
  const shouldWriteDescription = await promptConfirm({
    message: 'Do you want to write a description?',
    default: !!descriptionTemplate,
  });

  if (!shouldWriteDescription) { return ''; }

  return editText({
    fileType: 'markdown',
    startTemplate: descriptionTemplate,
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

export const command = 'pr';
export const aliases = [];
export const describe = 'Creates a pull request on your git server';

const findBaseBranch = async (currentBranchName: string, baseBranchNameFromCli?: string): Promise<string> => {
  if (baseBranchNameFromCli) { return baseBranchNameFromCli; }

  const currentBranch = parseBranchName(currentBranchName);
  const parentBranch = getParentBranch(currentBranch);

  return stringifyBranch(parentBranch);
};

export async function builder (yargs: any) {
  return yargs.usage(`usage: gut ${command} [options]`)
    .option('open', {
      alias: 'o',
      describe: 'Open the PR in the system\'s default browser',
      type: 'boolean',
    })
    .option('copy-url', {
      alias: 'c',
      describe: 'Copies the PR\'s URL to the system\'s clipboard.',
      type: 'boolean',
    })
    .option('assignee', {
      alias: 'a',
      describe: 'Sets the PR\'s assignee, defaults to the creator',
      type: 'string',
    })
    .option('base-branch', {
      alias: 'b',
      describe: 'Define the base branch on which the PR will be created manually. Defaults to the parent branch',
      type: 'string',
    })
    .option('remote', {
      alias: 'r',
      describe: 'The remote on which the PR will be done',
      type: 'string',
      default: 'origin',
    });
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
    const message = applyStyle('There are no commits added from the base branch, aborting.\n', [ theme.warning ]);
    await log(Deno.stdout, message);
    Deno.exit(1);
  }

  const commitsNumber = size(commitsInPr);
  await log(Deno.stdout, applyStyle(
    __`Auditing ${commitsNumber.toString()} commit(s)\n`,
    [ theme.commitsNumber ],
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

  const descriptionTemplate = await reviewTool.retrievePullRequestTemplate();
  const description = await promptForPrDescription(descriptionTemplate);

  if (!await getBranchRemote()) {
    await log(Deno.stdout, applyStyle('The branch was never pushed, pushing it now\n', [ theme.strong ]));
    await thrust(false);
  }

  const { owner: originOwner } = await getRepositoryFromRemote();
  const { owner: repositoryOwner, name: repositoryName } = await getRepositoryFromRemote(remote);
  const reviewToolConfiguration = configuration.global.tools?.github; // TODO: allow changing this from configuration
  const username = reviewToolConfiguration?.account?.username;
  const token = reviewToolConfiguration?.account?.password;

  if (!username || !token) {
    await log(Deno.stderr, applyStyle('No valid account found for git server: github', [ theme.error ]));
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
}

export const test = {};
