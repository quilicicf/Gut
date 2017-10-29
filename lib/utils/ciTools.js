const _ = require('lodash');
const unirest = require('unirest');

const branches = require('./branches');
const execution = require('./execution');

module.exports = (() => {
  const replaceItems = (templatedString, currentBranchName, branchInfo) => {
    return _(templatedString)
      .replace(/\$currentVersion/g, branchInfo.version)
      .replace(/\$ticketNumber/g, branchInfo.ticketNumber)
      .replace(/\$currentBranch/g, currentBranchName);
  };

  const CI_TOOLS = {
    jenkins: {
      executeJob (job, serverUri, ciUser) {
        const authorizationHeader = execution.base64Encode(`${ciUser.username}:${ciUser.password}`);
        const branchInfo = JSON.parse(branches.getBranchInfo(branches.BRANCH_INFO_PARTS.DESCRIPTION));
        const currentBranchName = branches.getCurrentBranch();

        const templatedBodyString = JSON.stringify(job.body);
        const evaluatedBodyString = replaceItems(templatedBodyString, currentBranchName, branchInfo);

        const fullUri = `${_.trimEnd(serverUri, '/')}/${_.trimStart(job.uri, '/')}`;

        return unirest.post(replaceItems(fullUri))
          .headers({
            Accept: 'application/json',
            Authorization: `Basic ${authorizationHeader}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Gut <https://github.com/quilicicf/Gut>'
          })
          .send(JSON.parse(evaluatedBodyString))
          .end((response) => {
            if (response.error) {
              execution.exit(1, `Failed with error: ${response.error.message}`);
            }

            execution.exit(0, 'Job launched'.green);
          });
      }
    }
  };

  return { CI_TOOLS };
})();
