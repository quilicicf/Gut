const _ = require('lodash');

const branches = require('./branches');
const execution = require('./execution');
const http = require('./http');

module.exports = (() => {
  const evaluateVariables = (templatedString, currentBranchName, branchInfo) => {
    return _(templatedString)
      .replace(/\$currentVersion/g, branchInfo.version)
      .replace(/\$ticketNumber/g, branchInfo.ticketNumber)
      .replace(/\$currentBranch/g, currentBranchName);
  };

  const CI_TOOLS = {
    jenkins: {
      async executeJob (job, serverUri, ciUser) {
        const authorizationHeader = execution.base64Encode(`${ciUser.username}:${ciUser.password}`);
        const branchInfo = JSON.parse(branches.getBranchInfo(branches.BRANCH_INFO_PARTS.DESCRIPTION));
        const currentBranchName = branches.getCurrentBranchName();

        const templatedBodyString = JSON.stringify(job.body);
        const evaluatedBodyString = evaluateVariables(templatedBodyString, currentBranchName, branchInfo);

        const fullUri = `${_.trimEnd(serverUri, '/')}/${_.trimStart(job.uri, '/')}`;

        const callOptions = {
          method: http.HTTP_METHODS.POST,
          headers: {
            Accept: 'application/json',
            Authorization: `Basic ${authorizationHeader}`,
            'Content-Type': 'application/json'
          },
          json: true,
          body: JSON.parse(evaluatedBodyString)
        };

        try {
          const response = await http.send(evaluateVariables(fullUri), callOptions);
          const statusCode = response.statusCode;
          if (statusCode < 299) {
            execution.exit(0, 'Job launched'.green);
          }

          const jsonBody = JSON.stringify(response.body, null, 2);
          execution.exit(1, `Jenkins call failed with status ${statusCode}.\nThe full error:\n${jsonBody}`);
        } catch (error) {
          execution.exit(1, `Impossible to run the job:\n${error.stack}`);
        }
      }
    }
  };

  return { CI_TOOLS };
})();
