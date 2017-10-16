const _ = require('lodash');

const execution = require('./utils/execution');

module.exports = (() => {
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

  return {
    divisions: yargs => {
      const args = yargs
        .usage('usage: $0 divisions [options]')
        .option('remote', {
          alias: 'r',
          default: 'local',
          describe: 'The remote whose branches should be displayed',
          type: 'string'
        })
        .coerce('remote', argument => {
          const remotesAsString = execution.execute('git remote show');
          const remotes = [ ..._.words(remotesAsString), ..._.keys(REMOTES_PRESET) ];
          if (!_.includes(remotes, argument)) {
            throw Error(`The remote should be in [ ${remotes} ]`);
          }

          return argument;
        })
        .help()
        .argv;

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
})();
