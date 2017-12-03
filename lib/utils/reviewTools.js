const url = require('url');
const https = require('https');

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
          }
        };
        return https.post(callOptions)
          .headers({
            Accept: 'application/json',
            Authorization: `Bearer ${options.pullRequestToken}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Gut <https://github.com/quilicicf/Gut>'
          })
          .send({
            title: options.prTitle,
            head: options.currentBranch,
            base: options.baseBranch,
            body: options.description
          })
          .end((response) => {
            execution.print(`Your PR is available at ${response.body.html_url}`);
          });
      }
    }
  };

  return { REVIEW_TOOLS };
})();
