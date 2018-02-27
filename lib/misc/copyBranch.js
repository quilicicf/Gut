const _ = require('lodash');

const path = require('path');

const copyPaste = require('copy-paste');

const branches = require('../utils/branches');
const execution = require('../utils/execution');

const NAME = path.parse(__filename).name;
const ALIASES = [ NAME.charAt(0) ];
const IDENTIFIERS = _.concat(NAME, ALIASES);
const DESCRIPTION = 'Copies the current branch name to the clipboard';

const copyBranchArgs = (yargs) => {
  return yargs.usage(`usage: $0 ${NAME} [options]`);
};

const copyBranchCommand = () => {
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
  NAME,
  ALIASES,
  IDENTIFIERS,
  DESCRIPTION,

  builder: copyBranchArgs,
  command: copyBranchCommand
};
