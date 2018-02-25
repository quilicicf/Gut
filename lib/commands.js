const _ = require('lodash');
const { auditArgs, auditCommand } = require('./git/audit');
const { burgeonArgs, burgeonCommand } = require('./git/burgeon');
const { configurationCommand } = require('./git/configure');
const { divisionsArgs, divisionsCommand } = require('./git/divisions');
const { executeArgs, executeCommand } = require('./git/execute');
const { historyArgs, historyCommand } = require('./git/history');
const { installCommand } = require('./git/install');
const { obliterateArgs, obliterateCommand } = require('./git/obliterate');
const { pileCommand } = require('./git/pile');
const { switchArgs, switchCommand } = require('./git/switch');
const { thrustArgs, thrustCommand } = require('./git/thrust');
const { undoArgs, undoCommand } = require('./git/undo');

const { ciCommand } = require('./advanced/ci');
const { prCommand } = require('./advanced/pr');

const { copyBranchCommand } = require('./misc/copyBranch');

const { jumpArgs, jumpCommand } = require('./git/jump');

const identifiers = (name, aliases) => {
  return _.concat(name, aliases);
};

const audit = {
  name: 'audit',
  aliases: [ 'a' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Audits a given diff',
  builder: auditArgs,
  command: auditCommand
};

const burgeon = {
  name: 'burgeon',
  aliases: [ 'b' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Creates a branch',
  builder: burgeonArgs,
  command: burgeonCommand
};

const configure = {
  name: 'configure',
  aliases: [ 'c' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Guides you to create/replace your configuration file',
  builder: _.identity,
  command: configurationCommand
};

const divisions = {
  name: 'divisions',
  aliases: [ 'd' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Displays the given remote\'s branches',
  builder: divisionsArgs,
  command: divisionsCommand
};

const execute = {
  name: 'execute',
  aliases: [ 'e' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Commits the staged changes',
  builder: executeArgs,
  command: executeCommand
};

const history = {
  name: 'history',
  aliases: [ 'h' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Displays the commit\'s history',
  builder: historyArgs,
  command: historyCommand
};

const install = {
  name: 'install',
  aliases: [ 'i' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Installs the shell scripts',
  builder: _.identity,
  command: installCommand
};

const obliterate = {
  name: 'obliterate',
  aliases: [ 'o' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Deletes a branch or a tag',
  builder: obliterateArgs,
  command: obliterateCommand
};

const pile = {
  name: 'pile',
  aliases: [ 'p' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Adds all changes in the repository',
  builder: _.identity,
  command: pileCommand
};

const sweetch = {
  name: 'switch',
  aliases: [ 's' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Checks out a branch',
  builder: switchArgs,
  command: switchCommand
};

const thrust = {
  name: 'thrust',
  aliases: [ 't' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Pushes local changes to a remote',
  builder: thrustArgs,
  command: thrustCommand
};

const undo = {
  name: 'undo',
  aliases: [ 'u' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Undoes commits',
  builder: undoArgs,
  command: undoCommand
};

const ci = {
  name: 'ci',
  aliases: [],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Interact with your CI tool',
  builder: _.identity,
  command: ciCommand
};

const pr = {
  name: 'pr',
  aliases: [],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Creates a pull request on your git server',
  builder: _.identity,
  command: prCommand
};

const copyBranch = {
  name: 'copy-branch',
  aliases: [ 'cb' ],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: 'Copies the current branch name to the clipboard',
  builder: _.identity,
  command: copyBranchCommand
};

const jump = {
  name: 'jump',
  aliases: [],
  identifiers () {
    return identifiers(this.name, this.aliases);
  },
  description: false,
  builder: jumpArgs,
  command: jumpCommand
};

module.exports = {
  audit,
  burgeon,
  configure,
  divisions,
  execute,
  history,
  install,
  obliterate,
  pile,
  switch: sweetch,
  thrust,
  undo,
  ci,
  pr,
  copyBranch,
  jump
};
