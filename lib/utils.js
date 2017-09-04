module.exports = (() => {
  require('colors');
  const _ = require('lodash');
  const fs = require('fs');
  const path = require('path');
  const execSync = require('child_process').execSync;

  const GIT_SERVERS_PRESET = {
    github: {
      getRepositoryUrl: (owner, repository) => {
        return `https://github.com/${owner}/${repository}`;
      }
    }
  };

  const REPOSITORY_OPTION_DEFAULTS = {
    commitMessageSuffixTemplate: ''
  };

  const BUILDABLE_BRANCH_TAG = 'build#';

  const OPTIONS_FILE_NAME = '.gut-config.json';

  const execute = command => {
    return execSync(command).toString();
  };

  const print = (...arguments) => console.log(...arguments);

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
    const allBranches = execute(`git branch 2> /dev/null`);
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
    const feature = featureFragment ? _.replace(featureFragment, BUILDABLE_BRANCH_TAG, '') : '';

    const ticketNumber = _(branchFragments)
      .filter(branch => /^[0-9]+$/.test(branch))
      .first();
    return {
      version: branchFragments[ 0 ],
      feature: feature,
      ticketNumber: ticketNumber,
      description: _.size(branchFragments) > 1 ? _.last(branchFragments) : '',
      isBuildable: isBuildable
    }

  };

  const buildBranchName = parsedBranch => {
    const versionFragment = parsedBranch.version;
    const featureFragment = `${parsedBranch.isBuildable ? BUILDABLE_BRANCH_TAG : ''}${parsedBranch.feature || ''}`;
    const ticketNumberFragment = parsedBranch.ticketNumber || '';
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

  const getRepositoryOption = optionName => {
    const topLevelDirectory = getTopLevel();

    let result;
    try {
      const repositoryOptionsFileName = path.resolve(topLevelDirectory, OPTIONS_FILE_NAME);
      fs.statSync(repositoryOptionsFileName);
      const repositoryOptions = JSON.parse(fs.readFileSync(repositoryOptionsFileName, 'utf8'));
      result = repositoryOptions[ optionName ];

    } catch (err) {
      result = REPOSITORY_OPTION_DEFAULTS[ optionName ];
    }

    if (!result) {
      throw Error(`Option ${optionName} is not specified in the repository's options.`.red)
    }

    return result;
  };

  return {
    GIT_SERVERS_PRESET: GIT_SERVERS_PRESET,
    OPTIONS_FILE_NAME: OPTIONS_FILE_NAME,

    execute: execute,
    print: print,

    getRepositoryOption: getRepositoryOption,

    getTopLevel: getTopLevel,
    moveUpTop: moveUpTop,

    isDirty: isDirty,
    hasStagedChanges: hasStagedChanges,
    hasUnstagedChanges: hasUnstagedChanges,

    getCurrentBranch: getCurrentBranch,
    parseBranchName: parseBranchName,
    buildBranchName: buildBranchName,
    isMasterBranch: isMasterBranch,
    isVersionBranch: isVersionBranch,
    isFeatureBranch: isFeatureBranch,
    isDevBranch: isDevBranch,

    getGitServer: serverName => {
      if (!_.has(GIT_SERVERS_PRESET, serverName)) {
        throw Error(`Server ${serverName} not configured. Please make sure it is not being implemented and create an issue.`);
      }

      return GIT_SERVERS_PRESET[ serverName ];
    }
  };
})();
