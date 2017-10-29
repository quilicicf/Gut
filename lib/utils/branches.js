const _ = require('lodash');
const execution = require('./execution');

module.exports = (() => {
  const BUILDABLE_BRANCH_TAG = 'build';

  const MASTER_BRANCH = {
    version: 'master',
    feature: '',
    ticketNumber: '',
    description: '',
    isBuildable: false,
    author: '',
    baseBranch: ''
  };

  const BRANCH_INFO_PARTS = {
    DESCRIPTION: 'description',
    REMOTE: 'remote'
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
        };
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
        };
      }
    }
  };

  const SPLITTER = '€$£';

  const LOG_FORMATS = {
    pretty: {
      format: '%Cred%H%Creset \n\t%s %Cgreen(%cr) %C(bold blue)<%an>%Creset \n\t%C(yellow)%d%Creset'
    },
    json: {
      format: `{"sha": "%H", "message": ${SPLITTER}%f${SPLITTER}, "author": "%an", "branches": "%D"}`,
      postProcessing: logs => {
        const logsList = _(logs.split('\n'))
          .map(logAsAlmostJson => logAsAlmostJson.split(SPLITTER))
          .map(splitLogAsAlmostJson => `${splitLogAsAlmostJson[ 0 ]}"${_.replace(splitLogAsAlmostJson[ 1 ], '"', '"')}"${splitLogAsAlmostJson[ 2 ]}`)
          .map(JSON.parse)
          .map(log => {
            const jsonifiedBranches = _(log.branches.split(', '))
              .map(branch => {
                const isHead = branch.includes('HEAD ->');
                const branchName = isHead
                  ? /^HEAD -> (.*)/.exec(branch)[ 1 ]
                  : branch;
                return {
                  isHead: isHead,
                  name: branchName
                };
              })
              .reject(branch => _.isEmpty(branch.name))
              .value();
            const jsonifiedLog = _.cloneDeep(log);
            jsonifiedLog.branches = jsonifiedBranches;
            return JSON.stringify(jsonifiedLog);
          })
          .value();
        return `[\n  ${_.join(logsList, ',\n  ')}\n]`;
      }
    },
    sha: {
      format: '%H'
    }
  };

  const getCurrentBranch = () => {
    const allBranches = execution.execute('git branch 2> /dev/null');
    return _(allBranches.split('\n'))
      .filter(branch => branch.startsWith('*'))
      .map(branch => _.replace(branch, '* ', ''))
      .first();
  };

  const searchForLocalBranch = regex => {
    const allBranches = execution.execute('git branch 2> /dev/null');
    return _(allBranches.split('\n'))
      .map(branch => _.replace(branch, /^[* ] /, ''))
      .filter(branch => regex.test(branch))
      .value();
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
      throw Error(`The branch name ${branchName} is not valid. Please read the specs at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md#branch-naming`.red);
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

  const getBranchInfo = (info, branch) => {
    const safeBranch = branch || getCurrentBranch();
    try {
      return execution.execute(`git config branch.${safeBranch}.${info}`);
    } catch (error) {
      return undefined;
    }
  };

  const checkBranchDescription = (branchDescription) => {
    const branchDescriptionKeys = _.keys(branchDescription);
    const masterBranchKeys = _.keys(MASTER_BRANCH);
    return _.includes(branchDescriptionKeys, masterBranchKeys);
  };

  const getBranchDescription = (branch) => {
    const safeBranch = branch || getCurrentBranch();
    const branchDescriptionAsJson = getBranchInfo(BRANCH_INFO_PARTS.DESCRIPTION, safeBranch);
    const branchDescription = JSON.parse(branchDescriptionAsJson || '{}');

    if (!checkBranchDescription(branchDescription)) {
      const parsedDescription = parseBranchName(branch);
      parsedDescription.author = 'public';

      execution.execute(`git config branch.${safeBranch}.description '${JSON.stringify(parsedDescription)}'`);

      return parsedDescription;
    }

    return branchDescription;
  };

  const getBranchOnlyCommits = (maxCommitNumber) => {
    const numberOfCommitsToInspect = maxCommitNumber || 50;
    const commitsToInspectAsAlmostJson = execution.execute(`git log HEAD~${numberOfCommitsToInspect}..HEAD --pretty=format:'${LOG_FORMATS.json.format}'`);
    const commitsToInspectAsJson = LOG_FORMATS.json.postProcessing(commitsToInspectAsAlmostJson);
    const commitsToInspect = JSON.parse(commitsToInspectAsJson);
    const branchDescription = getBranchDescription();
    const baseBranch = branchDescription.baseBranch;

    return _.takeWhile(commitsToInspect, commit => {
      return _.every(commit.branches, branch => branch.name !== baseBranch);
    });
  };

  return {
    LOG_FORMATS,
    BRANCH_TYPES,
    BRANCH_INFO_PARTS,

    getBranchOnlyCommits,
    getCurrentBranch,
    getBranchInfo,
    getBranchDescription,
    searchForLocalBranch,
    parseBranchName,
    buildBranchName,
    isMasterBranch,
    isVersionBranch,
    isFeatureBranch,
    isDevBranch
  };
})();
