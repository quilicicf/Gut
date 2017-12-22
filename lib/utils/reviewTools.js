const _ = require('lodash');

const execution = require('./execution');
const http = require('./http');

module.exports = (() => {
  const REVIEW_TOOLS = {
    github: {
      getPullRequestUrl (owner, repository) {
        return `https://api.github.com/repos/${owner}/${repository}/pulls`;
      },
      createPullRequest (options) {
        const callOptions = {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${options.pullRequestToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Gut <https://github.com/quilicicf/Gut>'
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
              const errorMessage = _.get(response.body, 'errors[0].message');
              execution.exit(1, errorMessage || `GitHub API call failed with status ${response.statusCode}.\nThe full error:\n${JSON.stringify(response.body, null, 2)}`);

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
