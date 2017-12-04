const url = require('url');
const http = require('./http');

const execution = require('./execution');

module.exports = (() => {
  const REVIEW_TOOLS = {
    github: {
      getPullRequestUrl (owner, repository) {
        return `https://api.github.com/repos/${owner}/${repository}/pulls`;
      },
      createPullRequest (options) {
        const callOptions = {
          ...url.parse(this.getPullRequestUrl(options.owner, options.repository)),
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
        return http.send(callOptions)
          .then((response) => {
            execution.print(`Your PR is available at ${response.body.html_url}`);
          })
          .catch((error) => {
            execution.exit(1, `Impossible to create the PR:\n${error.stack}`);
          });
      }
    }
  };

  return { REVIEW_TOOLS };
})();
