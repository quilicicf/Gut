const _ = require('lodash');

const path = require('path');

const copyPaste = require('copy-paste');

const branches = require('../../utils/branches');
const execution = require('../../utils/execution');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Copies the current branch name to the clipboard';

const copyBranchArgs = (yargs) => {
  return yargs.usage(`usage: gut ${command} [options]`);
};

const copyBranchHandler = () => {
  const currentBranch = branches.getCurrentBranchName();
  copyPaste.copy(currentBranch, (error) => {
    if (error) {
      execution.exit(1, 'Can\'t copy the current branch\'s name');
    }

    execution.print(`Branch name '${currentBranch}' copied to clipboard`.green);
    execution.exit(0);
  });
};

module.exports = {
  command,
  aliases,
  describe,
  builder: copyBranchArgs,
  handler: copyBranchHandler
};
