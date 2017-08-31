module.exports = (() => {
  require('colors');
  const _ = require('lodash');
  const execSync = require('child_process').execSync;

  const GIT_SERVERS_PRESET = {
    github: {
      getRepositoryUrl: (owner, repository) => {
        return `https://github.com/${owner}/${repository}`;
      }
    }
  };

  const getTopLevel = () => {
    const unsanitizedTopLevel = execSync('git rev-parse --show-toplevel');
    return _.replace(unsanitizedTopLevel, /\n/, '');
  };

  const moveUpTop = () => {
    process.chdir(getTopLevel());
  };

  const isDirty = () => {
    try {
      execSync('git diff --no-ext-diff --quiet --exit-code');
      return false;
    } catch (error) {
      return true;
    }
  };

  const hasStagedChanges = () => {
    try {
      execSync('git diff-index --cached --quiet HEAD --');
      return false;
    } catch (error) {
      return true;
    }
  };

  const hasUnstagedChanges = () => {
    try {
      execSync('[ -n "$(git ls-files --others --exclude-standard)" ]');
      return true;
    } catch (error) {
      return false;
    }
  };

  const getCurrentBranch = () => {
    const allBranches = execSync(`git branch 2> /dev/null`).toString();
    return _(allBranches.split('\n'))
      .filter(branch => branch.startsWith('*'))
      .map(branch => _.replace(branch, '* ', ''))
      .first();
  };

  const parseBranchName = branchName => {
    const branchFragments = (branchName ? branchName : getCurrentBranch()).split('_');

    const featureFragment = branchFragments.length > 1 && !/^[0-9]+$/.test(branchFragments[ 1 ])
      ? branchFragments[ 1 ]
      : '';
    const isBuildable = featureFragment.startsWith('build#');
    const feature = featureFragment ? _.replace(featureFragment, 'builo#', '') : '';

    const ticketNumber = _(branchFragments)
      .filter(branch => /^[0-9]+$/.test(branch))
      .first();
    return {
      version: branchFragments[ 0 ],
      feature: feature,
      ticketNumber: ticketNumber,
      explanation: _.last(branchFragments),
      isBuildable: isBuildable
    }

  };

  return {
    GIT_SERVERS_PRESET: GIT_SERVERS_PRESET,

    getTopLevel: getTopLevel,
    moveUpTop: moveUpTop,

    isDirty: isDirty,
    hasStagedChanges: hasStagedChanges,
    hasUnstagedChanges: hasUnstagedChanges,

    getCurrentBranch: getCurrentBranch,
    parseBranchName: parseBranchName,

    getGitServer: serverName => {
      if (!_.has(GIT_SERVERS_PRESET, serverName)) {
        throw Error(`Server ${serverName} not configured. Please make sure it is not being implemented and create an issue.`);
      }

      return GIT_SERVERS_PRESET[ serverName ];
    }
  };
})();
