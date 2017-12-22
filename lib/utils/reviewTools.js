const _ = require('lodash');

const execution = require('./execution');
const http = require('./http');

module.exports = (() => {
  const REVIEW_TOOLS = {
    github: {
      getPullRequestUrl (owner, repository) {
        return `https://api.github.com/repos/${owner}/${repository}/pulls`;
      },
      handleResponseError (response) {
        const error = _.get(response.body, 'errors[0]');

        if (error.field === 'head') {
          execution.exit(1, 'It looks like your branch was not pushed to upstream.');

        } else if (error.message) {
          execution.exit(1, error.message);

        } else {
          execution.exit(1, `GitHub API call failed with status ${response.statusCode}.\nThe full error:\n${JSON.stringify(response.body, null, 2)}`);

        }
      },
      createPullRequest (options) {
        const callOptions = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${options.pullRequestToken}`,
            'Content-Type': 'application/json'
          },
          json: true,
          body: {
            title: options.prTitle,
            head: options.currentBranch,
            base: options.baseBranch,
            body: options.description
          }
        };
        return http.send(this.getPullRequestUrl(options.owner, options.repository), callOptions)
          .then((response) => {
            if (response.statusCode < 299) {
              execution.print(`Your PR is available at ${response.body.html_url}`);

            } else {
              this.handleResponseError(response);

            }
          })
          .catch((error) => {
            execution.exit(1, `Impossible to create the PR:\n${error.stack}`);
          });
      }
    }
  };

  return { REVIEW_TOOLS };
})();
