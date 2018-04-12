const _ = require('lodash');

const fs = require('fs');
const os = require('os');
const path = require('path');

const audit = require('../git/audit');

const branches = require('../../utils/branches');
const configuration = require('../../utils/configuration');
const execution = require('../../utils/execution');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');
const reviewTools = require('../../utils/reviewTools');

const command = path.parse(__filename).name;
const aliases = [];
const describe = 'Creates a pull request on your git server';

const QUESTIONS = {
  CONFIRM_CREATE_PR: 'lib/advanced/pr:confirm_create_pr',
  CONFIRM_WRITE_DESCRIPTION: 'lib/advanced/pr:confirm_write_description',
  CHOOSE_PR_TITLE: 'lib/advanced/pr:choose_pr_title'
};

const ARG_OPEN_PR = {
  name: 'open',
  alias: 'o',
  describe: 'Open the PR in the system\'s default browser',
  type: 'boolean'
};

const createPullRequest = async () => {
  const parsedRepositoryPath = configuration.parseRepositoryPath();
  const reviewToolName = configuration.getRepositoryOption('reviewTool');
  const pullRequestToken = configuration.getGlobalOption(`accounts.${reviewToolName}.pullRequestToken`);

  const reviewTool = reviewTools.REVIEW_TOOLS[ reviewToolName ];

  if (!reviewTool) {
    execution.exit(1, `The review tool ${reviewToolName} is not supported at the moment.\n` +
      'Maybe this is a typo in your repository configuration file');
  }

  const lastTenCommitMessages = execution.execute('git --no-pager log -n 10 --pretty=format:\'%s\'')
    .split('\n');
  const choices = _(lastTenCommitMessages)
    .map((commitMessage, index) => {
      return [ index + 1, commitMessage ];
    })
    .fromPairs()
    .value();

  execution.print('\nLast 10 commit messages:');
  _(choices)
    .each((option, index) => {
      execution.print(`${index}: ${option}`);
    });

  execution.print('Choose a title for the PR.');
  const question = {
    type: QUESTION_TYPES.STRING,
    id: QUESTIONS.CHOOSE_PR_TITLE,
    message: 'You can choose from the list above by number, type a title or q to abort.',
    default: '1'
  };

  const choice = await ask(question);
  if (choice === 'q') {
    execution.exit(0, 'Operation aborted.');
  }

  const prTitle = _.inRange(choice, 1, 10) ? choices[ choice ] : choice;

  const confirmDescription = {
    type: QUESTION_TYPES.BOOLEAN,
    id: QUESTIONS.CONFIRM_WRITE_DESCRIPTION,
    message: 'Do you want to write a description ?',
    default: false
  };

  const shouldWriteDescription = await ask(confirmDescription);

  const prOptions = {
    owner: parsedRepositoryPath.ownerName,
    repository: parsedRepositoryPath.repositoryName,
    currentBranch: branches.getCurrentBranchName(),
    baseBranch: branches.getBranchDescription().baseBranch,
    pullRequestToken,
    prTitle
  };

  if (shouldWriteDescription) {
    const fileToEdit = path.resolve(os.tmpdir(), `gut_pr_${branches.getCurrentBranchName()}_description.txt`);
    execution.execute(`touch ${fileToEdit}`);
    await execution.openFile(fileToEdit);

    _.set(prOptions, 'description', fs.readFileSync(fileToEdit, 'utf8'));
  }

  return reviewTool.createPullRequest(prOptions);
};

const prArgs = (yargs) => {
  return yargs.usage(`usage: gut ${command} [options]`)
    .option(ARG_OPEN_PR.name, ARG_OPEN_PR)
    .help();
};

const prHandler = async (args) => {
  const branchOnlyCommits = branches.getBranchOnlyCommits();
  const numberOfCommits = _.size(branchOnlyCommits);

  if (numberOfCommits === 0) {
    execution.exit(0, 'There are no commits added from the base branch, aborting.'.yellow);
  }

  execution.print('Auditing the commits on the pull request'.bold);
  execution.print(`Number of commits for the current PR: ${numberOfCommits}`.cyan);
  const diff = execution.execute(`git --no-pager diff -U0 --no-color HEAD~${numberOfCommits}..HEAD`);
  audit.parseDiffAndDisplay(diff);

  const createPrQuestion = {
    type: QUESTION_TYPES.BOOLEAN,
    id: QUESTIONS.CONFIRM_CREATE_PR,
    message: 'Do you still want to create a PR for this branch ?',
    default: true
  };

  const shouldCreatePullRequest = await ask(createPrQuestion);

  if (!shouldCreatePullRequest) {
    execution.exit(0, 'Operation aborted by user.');
  }

  const prUrl = await createPullRequest();
  if (args[ ARG_OPEN_PR.name ]) {
    execution.openFile(prUrl);
  }
};

module.exports = {
  QUESTIONS,

  command,
  aliases,
  describe,
  builder: prArgs,
  handler: prHandler
};
