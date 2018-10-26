const _ = require('lodash');

const execution = require('./execution');
const { HTTP_METHODS, send } = require('./http');

const REVIEW_TOOLS = {
  github: {
    getPullRequestUrl (owner, repository) {
      return `https://api.github.com/repos/${owner}/${repository}/pulls`;
    },
    getAssigneesUrl (owner, repository, issueNumber) {
      return `https://api.github.com/repos/${owner}/${repository}/issues/${issueNumber}`;
    },
    async setCreatorAsAssignee (options, pullRequest) {
      const callOptions = {
        method: HTTP_METHODS.POST,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${options.pullRequestToken}`,
          'Content-Type': 'application/json',
        },
        json: true,
        body: {
          assignees: [ pullRequest.user.login ],
        },
      };
      try {
        send(this.getAssigneesUrl(options.owner, options.repository, pullRequest.number), callOptions);

      } catch (error) {
        execution.print(`Could not set the assignee due to ${error.stack}`);
      }
    },
    handleResponseError (response) {
      const message = _.get(response.body, 'message');
      const error = _.get(response.body, 'errors[0]') || {};

      if (message && _.isEmpty(error)) {
        execution.exit(1, `GitHub API call failed with message: ${message}.`);
      }

      if (error.field === 'head') {
        execution.exit(1, 'It looks like your branch was not pushed to upstream.');

      } else if (error.message) {
        execution.exit(1, error.message);

      } else {
        execution.exit(1, `GitHub API call failed with status ${response.statusCode}.\nThe full error:\n${JSON.stringify(response.body, null, 2)}`);

      }
    },
    async createPullRequest (options) {
      const callOptions = {
        method: HTTP_METHODS.POST,
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${options.pullRequestToken}`,
          'Content-Type': 'application/json',
        },
        json: true,
        body: {
          title: options.prTitle,
          head: options.currentBranch,
          base: options.baseBranch,
          body: options.description,
        },
      };

      try {
        const response = await send(this.getPullRequestUrl(options.owner, options.repository), callOptions);
        if (response.statusCode < 299) {
          const pullRequest = response.body;
          const prUrl = pullRequest.html_url;
          execution.print(`Your PR is available at ${prUrl}`);
          this.setCreatorAsAssignee(options, pullRequest);
          return pullRequest.html_url;

        }
        return this.handleResponseError(response);

      } catch (error) {
        return execution.exit(1, `Impossible to create the PR:\n${error.stack}`);
      }
    },
  },
};

module.exports = { REVIEW_TOOLS };
