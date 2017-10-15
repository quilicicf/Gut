const _ = require('lodash');

const fs = require('fs');
const os = require('os');
const path = require('path');
const unirest = require('unirest');

const branches = require('./branches');
const execution = require('./execution');
const prompt = require('./prompt');

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
            execution.print('response', response.body);
          });
      }
    }
  };



  return {
    REVIEW_TOOLS,
    createPullRequest
  };
})();
