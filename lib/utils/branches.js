module.exports = (() => {
  const _ = require('lodash');
  const execution = require('./execution');

  const BUILDABLE_BRANCH_TAG = 'build';

  const MASTER_BRANCH = {
    version: 'master',
    feature: '',
    ticketNumber: '',
    description: '',
    isBuildable: false
  };

  const BRANCH_TYPES = {
    VERSION: {
      name: 'version',
      matches: (parsedBranch) => {
        return _.isEmpty(parsedBranch.feature) && _.isEmpty(parsedBranch.description);
      },
      getBaseBranch: () => {
        return MASTER_BRANCH;
      }
    },
    FEATURE: {
      name: 'feature',
      matches: (parsedBranch) => {
        return !_.isEmpty(parsedBranch.feature) && _.isEmpty(parsedBranch.description);
      },
      getBaseBranch: (parsedBranch) => {
        return {
          version: parsedBranch.version,
          feature: '',
          ticketNumber: '',
          description: '',
          isBuildable: false
        }
      }
    },
    DEV: {
      name: 'dev',
      matches: (parsedBranch) => {
        return !_.isEmpty(parsedBranch.description);
      },
      getBaseBranch: (parsedBranch) => {
        return {
          version: parsedBranch.version,
          feature: parsedBranch.feature,
          ticketNumber: '',
          description: '',
          isBuildable: false
        }
      }
    }
  };

  const getCurrentBranch = () => {
    const allBranches = execution.execute(`git branch 2> /dev/null`);
    return _(allBranches.split('\n'))
      .filter(branch => branch.startsWith('*'))
      .map(branch => _.replace(branch, '* ', ''))
      .first();
  };

  const searchForLocalBranch = regex => {
    const allBranches = execution.execute(`git branch 2> /dev/null`);
    return _(allBranches.split('\n'))
      .map(branch => _.replace(branch, /^[* ] /, ''))
      .filter(branch => regex.test(branch))
      .value();
  };

  const parseBranchName = (branch) => {
    const branchName = branch || getCurrentBranch();
    const branchRegex = /^(([0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?)|master)(_([^#]+)?#([^_]+))?(_([0-9]+))?(_([^_]+))?$/;
    if (branchName === 'master') {
      return {
        version: 'master',
        feature: '',
        ticketNumber: '',
        description: '',
        isBuildable: false
      };

    } else if (!branchRegex.test(branchName)) {
      throw Error(`The branch name ${branchName} is not valid. Please read the specs at https://github.com/quilicicf/Gut/blob/master/specs/specs.md`.red);

    }

    const branchFragments = branchRegex.exec(branchName);
    const parsedBranch = {
      version: branchFragments[ 1 ],
      feature: branchFragments[ 6 ] || '',
      ticketNumber: branchFragments[ 8 ] || '',
      description: branchFragments[ 10 ] || '',
      isBuildable: branchFragments[ 5 ] === 'build'
    };

    const parsedBranchType = _.find(BRANCH_TYPES, (branchType) => {
      return branchType.matches(parsedBranch);
    });

    parsedBranch.type = parsedBranchType.name;
    parsedBranch.baseBranch = buildBranchName(parsedBranchType.getBaseBranch(parsedBranch));

    return parsedBranch;
  };

  const buildBranchName = parsedBranch => {
    const versionFragment = parsedBranch.version;
    const featureDescription = parsedBranch.feature || '';
    const featureFragment = featureDescription
      ? `${parsedBranch.isBuildable ? BUILDABLE_BRANCH_TAG : ''}#${featureDescription}`
      : '';
    const ticketNumberFragment = '' + (parsedBranch.ticketNumber || '');
    const descriptionFragment = parsedBranch.description || '';

    return _([ versionFragment, featureFragment, ticketNumberFragment, descriptionFragment ])
      .reject(fragment => _.isEmpty(fragment))
      .join('_');
  };

  const isMasterBranch = parsedBranch => {
    return parsedBranch.version === 'master'
      && !parsedBranch.feature
      && !parsedBranch.ticketNumber
      && !parsedBranch.description;
  };

  const isVersionBranch = parsedBranch => {
    return parsedBranch.version // TODO: semver-check dat
      && !parsedBranch.feature
      && !parsedBranch.ticketNumber
      && !parsedBranch.description;
  };

  const isFeatureBranch = parsedBranch => {
    return parsedBranch.version // TODO: semver-check dat
      && parsedBranch.feature
      && !parsedBranch.ticketNumber
      && !parsedBranch.description;
  };

  const isDevBranch = parsedBranch => {
    return parsedBranch.version // TODO: semver-check dat
      && parsedBranch.description;
  };

  return {
    BRANCH_TYPES,

    getCurrentBranch,
    searchForLocalBranch,
    parseBranchName,
    buildBranchName,
    isMasterBranch,
    isVersionBranch,
    isFeatureBranch,
    isDevBranch
  }
})();
