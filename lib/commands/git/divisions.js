const _ = require('lodash');

const path = require('path');

const execution = require('../../utils/execution');
const git = require('../../utils/git');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Displays the given remote\'s branches';

const ARG_REMOTE = {
  name: 'remote',
  alias: 'r',
  default: 'local',
  describe: 'The remote whose branches should be displayed',
  type: 'string',
};

const FILTER_LOCAL_BRANCHES = (branch) => !_.includes(branch, 'remote');
const FILTER_REMOTE_BRANCHES = (remoteName, branch) => _.includes(branch, `remotes/${remoteName}`);

const REMOTES_PRESET = {
  all: () => true,
  local: FILTER_LOCAL_BRANCHES,

  a: () => true,
  l: FILTER_LOCAL_BRANCHES,
  o: _.partial(FILTER_REMOTE_BRANCHES, 'origin'),
  u: _.partial(FILTER_REMOTE_BRANCHES, 'upstream'),
};

const divisionsArgs = (yargs) => yargs
  .usage(`usage: gut ${command} [options]`)
  .option(ARG_REMOTE.name, ARG_REMOTE)
  .coerce(ARG_REMOTE.name, (argument) => {
    const remotes = [ ...git.getRemotes(), ..._.keys(REMOTES_PRESET) ];
    if (!_.includes(remotes, argument)) {
      throw Error(`The remote should be in [ ${remotes} ]`);
    }

    return argument;
  })
  .help();

const divisionsHandler = (args) => {
  const remoteToInspect = args.remote;
  const allBranchesAsString = execution.execute('git branch -a --no-color --no-column').toString();
  const filter = _.has(REMOTES_PRESET, remoteToInspect)
    ? (branch) => REMOTES_PRESET[ remoteToInspect ](branch)
    : (branch) => FILTER_REMOTE_BRANCHES(remoteToInspect, branch);

  _(allBranchesAsString.split('\n'))
    .reject((branch) => branch.includes('HEAD'))
    .reject(_.isEmpty)
    .filter(filter)
    .each((branch) => execution.print(branch));
};

module.exports = {
  ARG_REMOTE,

  command,
  aliases,
  describe,
  builder: divisionsArgs,
  handler: divisionsHandler,
};
