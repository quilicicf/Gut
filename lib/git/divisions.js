const _ = require('lodash');

const path = require('path');

const execution = require('../utils/execution');
const git = require('../utils/git');

const FILTER_LOCAL_BRANCHES = branch => {
  return !_.includes(branch, 'remote');
};

const FILTER_REMOTE_BRANCHES = (remoteName, branch) => {
  return _.includes(branch, `remotes/${remoteName}`);
};

const REMOTES_PRESET = {
  all: () => true,
  local: FILTER_LOCAL_BRANCHES,

  a: () => true,
  l: FILTER_LOCAL_BRANCHES,
  o: _.partial(FILTER_REMOTE_BRANCHES, 'origin'),
  u: _.partial(FILTER_REMOTE_BRANCHES, 'upstream')
};

module.exports = {
  divisionsArgs: (yargs) => {
    return yargs
      .usage(`usage: $0 ${path.parse(__filename).name} [options]`)
      .option('remote', {
        alias: 'r',
        default: 'local',
        describe: 'The remote whose branches should be displayed',
        type: 'string'
      })
      .coerce('remote', argument => {
        const remotes = [ ...git.getRemotes(), ..._.keys(REMOTES_PRESET) ];
        if (!_.includes(remotes, argument)) {
          throw Error(`The remote should be in [ ${remotes} ]`);
        }

        return argument;
      })
      .help();
  },

  divisionsCommand: (args) => {
    const remoteToInspect = args.remote;
    const allBranchesAsString = execution.execute('git branch -a --no-color --no-column').toString();
    const filter = _.has(REMOTES_PRESET, remoteToInspect)
      ? branch => REMOTES_PRESET[ remoteToInspect ](branch)
      : branch => FILTER_REMOTE_BRANCHES(remoteToInspect, branch);

    _(allBranchesAsString.split('\n'))
      .reject(branch => branch.includes('HEAD'))
      .reject(_.isEmpty)
      .filter(filter)
      .each(branch => execution.print(branch));
  }
};
