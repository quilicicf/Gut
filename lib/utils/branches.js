const _ = require('lodash');
const execution = require('./execution');

const BUILDABLE_BRANCH_TAG = 'build';

const MASTER_BRANCH = {
  version: 'master',
  feature: '',
  ticketNumber: '',
  description: '',
  isBuildable: false,
  author: '',
  baseBranch: '',
};

const BRANCH_INFO_PARTS = { DESCRIPTION: 'description', REMOTE: 'remote' };

const REF_TYPES = {
  TAG: {
    regex: /^refs\/tags\/(.*)/,
    detect (refName) { return this.regex.test(refName); },
    extractSimpleRefName (refName) { return this.regex.exec(refName)[ 1 ]; },
  },
  STASH: {
    regex: /^refs\/stash$/,
    detect (refName) { return this.regex.test(refName); },
    extractSimpleRefName () { throw Error('Can\'t extract ref name on stash ref.'); },
  },
  HEADS: {
    regex: /^refs\/heads\/(.*)/,
    detect (refName) { return this.regex.test(refName); },
    extractSimpleRefName (refName) { return this.regex.exec(refName)[ 1 ]; },
  },
  REMOTE: {
    regex: /^refs\/remotes\/([^/]+)\/(.*)/,
    detect (refName) { return this.regex.test(refName); },
    extractSimpleRefName (refName) { return this.regex.exec(refName)[ 2 ]; },
  },
};

const BRANCH_TYPES = {
  VERSION: {
    name: 'version',
    matches: parsedBranch => _.isEmpty(parsedBranch.feature) && _.isEmpty(parsedBranch.description),
    getBaseBranch: () => MASTER_BRANCH,
  },
  FEATURE: {
    name: 'feature',
    matches: parsedBranch => !_.isEmpty(parsedBranch.feature) && _.isEmpty(parsedBranch.description),
    getBaseBranch: parsedBranch => ({
      version: parsedBranch.version,
      feature: '',
      ticketNumber: '',
      name: '',
      isBuildable: false,
    }),
  },
  DEV: {
    name: 'dev',
    matches: parsedBranch => !_.isEmpty(parsedBranch.description),
    getBaseBranch: parsedBranch => ({
      version: parsedBranch.version,
      feature: parsedBranch.feature,
      ticketNumber: '',
      name: '',
      isBuildable: false,
    }),
  },
};

const SPLITTER = '€$£';

const LOG_FORMATS = {
  pretty: { format: '%Cred%H%Creset \n\t%s %Cgreen(%cr) %C(bold blue)<%an>%Creset \n\t%C(yellow)%d%Creset' },
  simple: { format: '%Cred%h%Creset %s %C(bold blue)<%an>%Creset' },
  json: {
    format: `{"sha": "%H", "message": ${SPLITTER}%f${SPLITTER}, "author": "%an", "branches": "%D"}`,
    postProcessing: (logs) => {
      const logsList = _(logs.split('\n'))
        .map(logAsAlmostJson => logAsAlmostJson.split(SPLITTER))
        .map(splitLogAsAlmostJson => (
          `${splitLogAsAlmostJson[ 0 ]}"${_.replace(splitLogAsAlmostJson[ 1 ], '"', '"')}"${splitLogAsAlmostJson[ 2 ]}`
        ))
        .map(JSON.parse)
        .map((log) => {
          const jsonifiedBranches = _(log.branches.split(', '))
            .map((branch) => {
              const isHead = branch.includes('HEAD ->');
              const branchName = isHead
                ? /^HEAD -> (.*)/.exec(branch)[ 1 ]
                : branch;
              return {
                isHead,
                name: branchName,
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
    },
  },
  sha: { format: '%H' },
};

const getAllRefs = () => {
  const refsAsString = _.replace(execution.execute('git show-ref'), /\n$/, '');

  return _(refsAsString.split('\n'))
    .map(refAsString => refAsString.split(' ')[ 1 ])
    .filter(refName => !REF_TYPES.STASH.detect(refName))
    .map((refName) => {
      if (REF_TYPES.HEADS.detect(refName)) { return REF_TYPES.HEADS.extractSimpleRefName(refName); }
      if (REF_TYPES.REMOTE.detect(refName)) { return REF_TYPES.REMOTE.extractSimpleRefName(refName); }
      if (REF_TYPES.TAG.detect(refName)) { return REF_TYPES.TAG.extractSimpleRefName(refName); }

      throw Error(`Unknown ref type for ref: ${refName}`);
    })
    .filter(refName => refName !== 'HEAD')
    .uniq()
    .sortBy()
    .value();
};

const getCurrentBranchName = () => _.replace(execution.execute('git rev-parse --abbrev-ref HEAD'), '\n', '');

const buildBranchName = (parsedBranch) => {
  const versionFragment = parsedBranch.version;
  const featureDescription = parsedBranch.feature || '';
  const featureFragment = featureDescription
    ? `${parsedBranch.isBuildable ? BUILDABLE_BRANCH_TAG : ''}#${featureDescription}`
    : '';
  const ticketNumberFragment = `${parsedBranch.ticketNumber || ''}`;
  const descriptionFragment = parsedBranch.description || '';

  return _([ versionFragment, featureFragment, ticketNumberFragment, descriptionFragment ])
    .reject(fragment => _.isEmpty(fragment))
    .join('_');
};

const parseGutCompliantBranchName = (branchName) => {
  const branchRegex = /^(([0-9]+\.[0-9]+\.[0-9]+(\.[0-9]+)?)|master)(_([^#]+)?#([^_]+))?(_([0-9]+))?(_([^_]+))?$/;
  const branchFragments = branchRegex.exec(branchName);

  return branchFragments
    ? {
      version: branchFragments[ 1 ],
      feature: branchFragments[ 6 ] || '',
      ticketNumber: branchFragments[ 8 ] || '',
      description: branchFragments[ 10 ] || '',
      isBuildable: branchFragments[ 5 ] === 'build',
    }
    : null;
};

const parseDegradedBranchName = (branchName) => {
  const branchRegex = /^([^_]+)(_([0-9]+))?(_([^_]+))?/;
  const branchFragments = branchRegex.exec(branchName);

  return branchFragments
    ? {
      version: branchFragments[ 1 ],
      feature: '',
      ticketNumber: branchFragments[ 3 ] || '',
      description: branchFragments[ 5 ] || '',
      isBuildable: false,
    }
    : null;
};

const addTypeAndBaseBranch = (parsedBranch) => {
  const result = _.cloneDeep(parsedBranch);
  const parsedBranchType = _.find(BRANCH_TYPES, branchType => branchType.matches(parsedBranch));

  result.type = parsedBranchType.name;
  result.baseBranch = buildBranchName(parsedBranchType.getBaseBranch(parsedBranch));

  return result;
};

const parseBranchName = (branch) => {
  const branchName = branch || getCurrentBranchName();
  if (branchName === 'master') {
    return {
      version: 'master',
      feature: '',
      ticketNumber: '',
      description: '',
      isBuildable: false,
    };
  }

  const parsedCompliantBranch = parseGutCompliantBranchName(branchName);

  if (parsedCompliantBranch) {
    return addTypeAndBaseBranch(parsedCompliantBranch);
  }

  execution.print(`The branch name ${branchName} is not valid. Attempting degraded-mode parsing`.yellow);
  const parsedDegradedBranch = parseDegradedBranchName(branchName);

  if (!parsedDegradedBranch) {
    throw Error(`The branch name ${branchName} is not valid. Please read the specs at https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md#branch-naming`.red);
  }

  return addTypeAndBaseBranch(parsedDegradedBranch);
};

const isMasterBranch = parsedBranch => parsedBranch.version === 'master'
  && !parsedBranch.feature
  && !parsedBranch.ticketNumber
  && !parsedBranch.description;

const isVersionBranch = parsedBranch => parsedBranch.version // TODO: semver-check dat
  && !parsedBranch.feature
  && !parsedBranch.ticketNumber
  && !parsedBranch.description;

const isFeatureBranch = parsedBranch => parsedBranch.version // TODO: semver-check dat
  && parsedBranch.feature
  && !parsedBranch.ticketNumber
  && !parsedBranch.description;

const isDevBranch = parsedBranch => parsedBranch.version // TODO: semver-check dat
  && parsedBranch.description;

const getBranchInfo = (info, branch) => {
  const safeBranch = branch || getCurrentBranchName();
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
  const safeBranch = branch || getCurrentBranchName();
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

/**
 * Gets the branch's parent (parsed).
 * If the targetBranchType is specified, you can skip parents to get an older ancestor.
 */
const getBranchParent = (parsedBranch, targetBranchType) => {
  const currentBranchType = BRANCH_TYPES[ _.toUpper(parsedBranch.type) ];
  const baseBranch = currentBranchType.getBaseBranch(parsedBranch);
  const typedBaseBranch = addTypeAndBaseBranch(baseBranch);

  return targetBranchType && typedBaseBranch.type !== targetBranchType.name
    ? getBranchParent(baseBranch, targetBranchType)
    : typedBaseBranch;
};

/**
 * Returns the commits that are present on this branch but not $baseBranchName.
 */
const getCommitsFrom = (baseBranchName) => {
  const mergeBase = execution.execute(`git merge-base ${baseBranchName} HEAD`).replace(/\n$/, '');
  const commitsAsAlmostJson = execution.execute(`git --no-pager log ${mergeBase}..HEAD --pretty=format:'${LOG_FORMATS.json.format}'`);
  const commitsAsJson = LOG_FORMATS.json.postProcessing(commitsAsAlmostJson);
  return JSON.parse(commitsAsJson);
};

const getLastCommits = (commitsNumber) => {
  const commitsAsAlmostJson = execution.execute(`git --no-pager log -n ${commitsNumber} --pretty=format:'${LOG_FORMATS.json.format}'`);
  const commitsAsJson = LOG_FORMATS.json.postProcessing(commitsAsAlmostJson);
  return JSON.parse(commitsAsJson);
};

/**
 * Returns the commits that are present on this branch but not its direct parent.
 */
const getBranchOnlyCommits = () => {
  const baseBranchName = getBranchDescription().baseBranch;
  return getCommitsFrom(baseBranchName);
};

module.exports = {
  LOG_FORMATS,
  BRANCH_TYPES,
  BRANCH_INFO_PARTS,

  getAllRefs,
  getLastCommits,
  getCommitsFrom,
  getBranchOnlyCommits,
  getCurrentBranchName,
  getBranchInfo,
  getBranchDescription,
  parseBranchName,
  buildBranchName,
  isMasterBranch,
  isVersionBranch,
  isFeatureBranch,
  isDevBranch,
  getBranchParent,
};
