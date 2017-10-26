const unirest = require('unirest');

const execution = require('./execution');

module.exports = (() => {
  const REVIEW_TOOLS = {
    github: {
      getPullRequestUrl (owner, repository) {
        return `https://api.github.com/repos/${owner}/${repository}/pulls`;
      },
      createPullRequest (options) {
        const pullRequestUrl = this.getPullRequestUrl(options.owner, options.repository);
        return unirest.post(pullRequestUrl)
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
            execution.print(`Your PR is available at ${response.body.url}`);
          });
      }
    }
  };

  return { REVIEW_TOOLS };
})();
