const _ = require('lodash');

const fs = require('fs');
const os = require('os');
const path = require('path');

const audit = require('./audit');

const branches = require('./utils/branches');
const configuration = require('./utils/configuration');
const execution = require('./utils/execution');
const prompt = require('./utils/prompt');
const reviewTools = require('./utils/reviewTools');

module.exports = (() => {
  const createPullRequest = (shouldCreatePullRequest) => {
    if (!shouldCreatePullRequest) {
      execution.exit('Operation aborted by user.', 0);
    }

    const parsedRepositoryPath = configuration.parseRepositoryPath();
    const pullRequestToken = configuration.getGlobalOption(`accounts.${parsedRepositoryPath.gitServer}.pullRequestToken`);

    const reviewTool = reviewTools.REVIEW_TOOLS[ parsedRepositoryPath.gitServer ];

    if (!reviewTool) {
      execution.exit(`The review tool ${parsedRepositoryPath.gitServer} is not supported at the moment.\n` +
        'Maybe this is a typo in your repository configuration file', 1);
    }

    const lastTenCommitMessages = execution.execute('git --no-pager log -n 10 --pretty=format:\'%s\'').split('\n');
    const choices = _(lastTenCommitMessages)
      .map((commitMessage, index) => {
        return [ index + 1, commitMessage ];
      })
      .fromPairs();

    execution.print('\nLast 10 commit messages:');
    _(choices).each((option, index) => {
      execution.print(`${index}: ${option}`);
    });
    execution.print('Choose a title for the PR.');
    prompt.promisifiedPrompt('You can choose from the list above by number, type a title or q to abort.')
      .then((choice) => {
        if (choice === 'q') {
          execution.exit('Operation aborted.', 0);
        }

        return _.inRange(choice, 1, 10)
          ? choices[ choice ]
          : choice;
      })
      .then(prTitle => {
        return prompt.yesNoPromisifiedPrompt('Do you want to write a description ?')
          .then(choice => {
            if (choice) {
              const fileToEdit = path.resolve(os.tmpdir(), `gut_pr_${branches.getCurrentBranch()}_description.txt`);
              execution.execute(`touch ${fileToEdit}`);
              execution.openFile(fileToEdit);

              return {
                prTitle,
                description: fs.readFileSync(fileToEdit, 'utf8')
              };
            }

            return { prTitle };
          });
      })
      .then(texts => {
        return reviewTool.createPullRequest({
          owner: parsedRepositoryPath.ownerName,
          repository: parsedRepositoryPath.repositoryName,
          prTitle: texts.prTitle,
          description: texts.description,
          currentBranch: branches.getCurrentBranch(),
          baseBranch: branches.getBranchDescription().baseBranch,
          pullRequestToken
        });
      });
  };

  return {
    query: () => {

      const branchOnlyCommits = branches.getBranchOnlyCommits();
      const numberOfCommits = _.size(branchOnlyCommits);

      if (numberOfCommits === 0) {
        execution.exit('There are no commits added from the base branch, aborting.'.yellow, 0);
      }

      execution.print('Auditing the commits on the pull request'.bold);
      execution.print(`Number of commits for the current PR: ${numberOfCommits}`.cyan);
      const diff = execution.execute(`git --no-pager diff -U0 --no-color HEAD~${numberOfCommits}..HEAD`);
      audit.parseDiffAndDisplay(diff);

      prompt.yesNoPrompt('Do you still want to create a PR for this branch ?', createPullRequest);
    }
  };
})();
