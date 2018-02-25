const copyPaste = require('copy-paste');

const branches = require('../utils/branches');
const execution = require('../utils/execution');

module.exports = {
  copyBranchCommand () {
    const currentBranch = branches.getCurrentBranchName();
    copyPaste.copy(currentBranch, (error) => {
      if (error) {
        execution.exit(1, 'Can\'t copy the current branch\'s name');
      }

      execution.print(`Branch name '${currentBranch}' copied to clipboard`.green);
      execution.exit(0);
    });
  }
};
