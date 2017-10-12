module.exports = (() => {
  const _ = require('lodash');
  const os = require('os');
  const fs = require('fs');
  const path = require('path');
  const execSync = require('child_process').execSync;
  const spawn = require('child_process').spawn;
  const promptly = require('promptly');

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

  const SPLITTER = '€$£';

  const LOG_FORMATS = {
    pretty: {
      format: '%Cred%H%Creset \n\t%s %Cgreen(%cr) %C(bold blue)<%an>%Creset \n\t%C(yellow)%d%Creset',
      postProcessing: _.identity
    },
    json: {
      format: `{"sha": "%H", "message": ${SPLITTER}%f${SPLITTER}, "author": "%an", "branches": "%D"}`,
      postProcessing: logs => {
        const logsList = _(logs.split('\n'))
          .map(logAsAlmostJson => logAsAlmostJson.split(SPLITTER))
          .map(splitLogAsAlmostJson => `${splitLogAsAlmostJson[ 0 ]}"${_.replace(splitLogAsAlmostJson[ 1 ], '"', '\"')}"${splitLogAsAlmostJson[ 2 ]}`)
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
        return `[\n  ${_.join(logsList, ',\n  ')}\n]`
      }
    },
    sha: {
      format: '%H',
      postProcessing: _.identity
    }
  };

  const GIT_SERVERS_PRESET = {
    github: {
      getRepositoryUrl: (owner, repository) => {
        return `git@github.com:${owner}/${repository}.git`;
      }
    }
  };

  const REPOSITORY_OPTION_DEFAULTS = {
    commitMessageSuffixTemplate: ''
  };

  const BUILDABLE_BRANCH_TAG = 'build';

  const GLOBAL_OPTIONS_FILE_PATH = path.resolve(os.homedir(), '.config', 'gut', 'gut-config.json');

  const SCRIPTS_PATH = path.resolve(os.homedir(), '.config', 'gut');

  const REPOSITORY_OPTIONS_FILE_NAME = '.gut-config.json';

  const configureGutIfNeeded = () => {
    const gutOptionsPath = GLOBAL_OPTIONS_FILE_PATH;
    try {
      fs.statSync(gutOptionsPath);
      return new Promise((resolve) => resolve(JSON.parse(fs.readFileSync(gutOptionsPath, 'utf8'))));
    } catch (err) {
      return require('./configure').initializeConfiguration();
    }
  };

  const execute = command => {
    return execSync(command).toString();
  };

  const executeAndPipe = (command, arguments) => {
    spawn(command, arguments, { stdio: 'inherit' });
  };

  const print = console.log;

  const exit = (message, exitCode) => {
    print(exitCode === 0 ? message.green : message.red);
    process.exit(exitCode);
  };

  const promisifiedPrompt = (message, options) => {
    return new Promise((resolve, reject) => {
      promptly.prompt(message, options, (error, value) => {
        return error
          ? reject(error)
          : resolve(value);
      });
    });
  };

  const yesNoPrompt = (message, callback) => {
    const options = {
      default: 'n',
      validator: choice => choice === 'y'
    };
    promptly.prompt(`${message} (y/n)`, options, (error, value) => {
      if (error) {
        throw error;
      }

      callback(value);
    });
  };

  const mergeArrayCustomizer = (seed, otherSource) => {
    if (_.isArray(seed)) {
      return seed.concat(otherSource);
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

  const searchForLocalBranch = regex => {
    const allBranches = execute(`git branch 2> /dev/null`);
    return _(allBranches.split('\n'))
      .map(branch => _.replace(branch, /^[* ] /, ''))
      .filter(branch => regex.test(branch))
      .value();
  };

  const getCurrentBranch = () => {
    const allBranches = execute(`git branch 2> /dev/null`);
    return _(allBranches.split('\n'))
      .filter(branch => branch.startsWith('*'))
      .map(branch => _.replace(branch, '* ', ''))
      .first();
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

  const getRepositoryOption = optionName => {
    const topLevelDirectory = getTopLevel();

    let result;
    try {
      const repositoryOptionsFileName = path.resolve(topLevelDirectory, REPOSITORY_OPTIONS_FILE_NAME);
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

  const getRemotes = () => {
    const remotesAsString = execute(`git remote show`);
    return _(remotesAsString.split('\n'))
      .reject(remote => _.isEmpty(remote))
      .value();
  };

  const getBranchInfo = (branch, info) => {
    const safeBranch = branch || getCurrentBranch();
    try {
      return execute(`git config branch.${safeBranch}.${info}`);
    } catch (error) {
      return undefined;
    }
  };

  const getGitServer = (serverName) => {
    if (!_.has(GIT_SERVERS_PRESET, serverName)) {
      throw Error(`Server ${serverName} not configured. Please make sure it is not being implemented and create an issue.`);
    }

    return GIT_SERVERS_PRESET[ serverName ];
  };

  const branchOnlyCommits = (maxCommitNumber) => {
    const commitsToInspectAsJson = execute(`git log HEAD~${maxCommitNumber}..HEAD --pretty=format:'${LOG_FORMATS.json}'`);
    const commitsToInspect = JSON.parse(commitsToInspectAsJson);
    const branchDescription = JSON.parse(getBranchInfo(getCurrentBranch(), 'description')); // TODO: variabelize that
    const baseBranch = branchDescription.baseBranch;

    return _.takeWhile(commitsToInspect, commit => {
      _.every(commit.branches, branch => branch.name !== baseBranch)
    });
  };

  return {
    BRANCH_TYPES,
    LOG_FORMATS,
    GIT_SERVERS_PRESET,
    GLOBAL_OPTIONS_FILE_PATH,
    SCRIPTS_PATH,
    REPOSITORY_OPTIONS_FILE_NAME,

    configureGutIfNeeded,

    execute,
    executeAndPipe,
    print,
    exit,

    yesNoPrompt,
    promisifiedPrompt,

    mergeArrayCustomizer,

    getRepositoryOption,

    getTopLevel,
    moveUpTop,

    isDirty,
    hasStagedChanges,
    hasUnstagedChanges,

    getCurrentBranch,
    searchForLocalBranch,
    parseBranchName,
    buildBranchName,
    isMasterBranch,
    isVersionBranch,
    isFeatureBranch,
    isDevBranch,

    getRemotes,
    getBranchInfo,

    getGitServer
  };
})();
