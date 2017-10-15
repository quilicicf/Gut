const _ = require('lodash');
const os = require('os');
const fs = require('fs');
const path = require('path');

const execution = require('./utils/execution');
const branches = require('./utils/branches');
const configure = require('./configure');

module.exports = (() => {
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
        return `[\n  ${_.join(logsList, ',\n  ')}\n]`;
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

  const GLOBAL_OPTIONS_FILE_PATH = path.resolve(os.homedir(), '.config', 'gut', 'gut-config.json');

  const SCRIPTS_PATH = path.resolve(os.homedir(), '.config', 'gut');

  const REPOSITORY_OPTIONS_FILE_NAME = '.gut-config.json';

  const configureGutIfNeeded = () => {
    const gutOptionsPath = GLOBAL_OPTIONS_FILE_PATH;
    try {
      fs.statSync(gutOptionsPath);
      return new Promise((resolve) => resolve(JSON.parse(fs.readFileSync(gutOptionsPath, 'utf8'))));
    } catch (err) {
      return configure.initializeConfiguration();
    }
  };

  const mergeArrayCustomizer = (seed, otherSource) => {
    const seedArray = _.isArray(seed) ? seed : [ seed ];
    return seedArray.concat(otherSource);
  };

  const getTopLevel = () => {
    const unsanitizedTopLevel = execution.execute('git rev-parse --show-toplevel');
    return _.replace(unsanitizedTopLevel, /\n/, '');
  };

  const moveUpTop = () => {
    process.chdir(getTopLevel());
  };

  const isDirty = () => {
    try {
      execution.execute('git diff --no-ext-diff --quiet --exit-code');
      return false;
    } catch (error) {
      return true;
    }
  };

  const hasStagedChanges = () => {
    try {
      execution.execute('git diff-index --cached --quiet HEAD --');
      return false;
    } catch (error) {
      return true;
    }
  };

  const hasUnstagedChanges = () => {
    try {
      execution.execute('[ -n "$(git ls-files --others --exclude-standard)" ]');
      return true;
    } catch (error) {
      return false;
    }
  };

  const getRepositoryOption = optionName => {
    const topLevelDirectory = getTopLevel();

    let result;
    try {
      const repositoryFileName = path.resolve(topLevelDirectory, REPOSITORY_OPTIONS_FILE_NAME);
      fs.statSync(repositoryFileName);
      const repositoryOptions = JSON.parse(fs.readFileSync(repositoryFileName, 'utf8'));
      result = repositoryOptions[ optionName ];
    } catch (err) {
      result = REPOSITORY_OPTION_DEFAULTS[ optionName ];
    }

    if (!result) {
      throw Error(`Option ${optionName} is not specified in the repository's options.`.red);
    }

    return result;
  };

  const getRemotes = () => {
    const remotesAsString = execution.execute('git remote show');
    return _(remotesAsString.split('\n'))
      .reject(remote => _.isEmpty(remote))
      .value();
  };

  const getBranchInfo = (branch, info) => {
    const safeBranch = branch || branches.getCurrentBranch();
    try {
      return execution.execute(`git config branch.${safeBranch}.${info}`);
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

  const getBranchOnlyCommits = (maxCommitNumber) => {
    const numberOfCommitsToInspect = maxCommitNumber || 50;
    const commitsToInspectAsAlmostJson = execution.execute(`git log HEAD~${numberOfCommitsToInspect}..HEAD --pretty=format:'${LOG_FORMATS.json.format}'`);
    const commitsToInspectAsJson = LOG_FORMATS.json.postProcessing(commitsToInspectAsAlmostJson);
    const commitsToInspect = JSON.parse(commitsToInspectAsJson);
    const branchDescription = JSON.parse(getBranchInfo(branches.getCurrentBranch(), 'description')); // TODO: variabelize that
    const baseBranch = branchDescription.baseBranch;

    return _.takeWhile(commitsToInspect, commit => {
      return _.every(commit.branches, branch => branch.name !== baseBranch);
    });
  };

  return _.merge({
    LOG_FORMATS,
    GIT_SERVERS_PRESET,
    GLOBAL_OPTIONS_FILE_PATH,
    SCRIPTS_PATH,
    REPOSITORY_OPTIONS_FILE_NAME,

    configureGutIfNeeded,
    getRepositoryOption,

    mergeArrayCustomizer,

    moveUpTop,

    isDirty,
    hasStagedChanges,
    hasUnstagedChanges,

    getBranchOnlyCommits,

    getRemotes,
    getBranchInfo,

    getGitServer
  }, execution, branches);
})();
