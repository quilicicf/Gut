const path = require('path');

const branches = require('../../utils/branches');
const execution = require('../../utils/execution');

const command = path.parse(__filename).name;
const aliases = [ 'cb' ];
const describe = 'Copies the current branch name to the clipboard';

const copyBranchArgs = (yargs) => {
  return yargs.usage(`usage: gut ${command} [options]`);
};

const copyBranchHandler = async () => {
  const currentBranch = branches.getCurrentBranchName();
  await execution.copy(currentBranch, 'current branch name');
  execution.exit(0);
};

module.exports = {
  command,
  aliases,
  describe,
  builder: copyBranchArgs,
  handler: copyBranchHandler
};
