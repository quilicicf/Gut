const _ = require('lodash');

const path = require('path');

const branches = require('../../utils/branches');
const execution = require('../../utils/execution');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Checks out a branch';

const QUESTIONS = {
  CHOOSE_MATCHING_BRANCH: 'lib/git/switch:choose_matching_branch'
};

const ARG_TARGET = {
  name: 'target',
  alias: 't',
  describe: 'The target branch',
  type: 'string',
  conflicts: [ 'regex', 'ticket-number' ]
};

const ARG_REGEX = {
  name: 'regex',
  alias: 'r',
  describe: 'A regex to find the branch to check out',
  type: 'string',
  conflicts: [ 'target', 'ticket-number' ]
};

const ARG_TICKET_NUMBER = {
  name: 'ticket-number',
  alias: 'n',
  describe: 'Specifies the ticket number to switch branches',
  type: 'integer',
  conflicts: [ 'target', 'regex' ]
};

const ARG_MASTER = {
  name: 'm',
  describe: 'Switch to master',
  type: 'boolean'
};

const ARG_VERSION = {
  name: 'v',
  describe: 'Switch to the version branch',
  type: 'boolean'
};

const ARG_FEATURE = {
  name: 'f',
  describe: 'Switch to feature branch',
  type: 'boolean'
};

const ARG_BASE = {
  name: 'b',
  describe: 'Switch to base branch',
  type: 'boolean'
};

const ARG_LAST = {
  name: 'l',
  describe: 'Switch to last branch',
  type: 'boolean'
};

const switchArgs = (yargs) => {
  const ALL_ARGUMENTS = [
    ARG_TARGET,
    ARG_REGEX,
    ARG_TICKET_NUMBER,
    ARG_MASTER,
    ARG_VERSION,
    ARG_FEATURE,
    ARG_BASE,
    ARG_LAST
  ];

  return yargs
    .usage(`usage: gut ${command} [options]`)
    .options(_.keyBy(ALL_ARGUMENTS, 'name'))
    .check(currentArguments => {
      const hasNoArguments = _(currentArguments)
        .filter((value, name) => !/^\$/.test(name))
        .filter((value) => value)
        .isEmpty();

      if (hasNoArguments) {
        throw Error('You must specify a target branch, either by name, regex, ticket number or shortcut..'.red);
      }

      return true;
    })
    .help();
};

const switchHandler = async (args) => {
  const target = args[ ARG_TARGET.name ];
  const regex = args[ ARG_REGEX.name ];
  const ticketNumber = args[ ARG_TICKET_NUMBER.name ];
  const toMaster = args[ ARG_MASTER.name ];
  const toVersion = args[ ARG_VERSION.name ];
  const toFeature = args[ ARG_FEATURE.name ];
  const toBase = args[ ARG_BASE.name ];
  const toLast = args[ ARG_LAST.name ];
  const branchDescription = branches.getBranchDescription();

  if (toMaster) {
    execution.execute('git checkout master');

  } else if (toVersion) {
    execution.execute(`git checkout ${branchDescription.version}`);

  } else if (toFeature) {
    try {
      const parsedFeatureBranch = branches.getBranchParent(branchDescription, branches.BRANCH_TYPES.FEATURE);
      execution.execute(`git checkout ${branches.buildBranchName(parsedFeatureBranch)}`);
    } catch (error) {
      execution.exit(1, `Can't find the feature version from ${branches.getCurrentBranchName()}.`);
    }

  } else if (toBase) {
    const parsedBaseBranch = branches.getBranchParent(branchDescription);
    execution.execute(`git checkout ${branches.buildBranchName(parsedBaseBranch)}`);

  } else if (toLast) {
    execution.executeAndPipe('git checkout -');

  } else if (target) {
    execution.execute(`git checkout ${target}`);

  } else {
    const branchRegex = new RegExp(regex || `^[^_]+_${ticketNumber}_`, 'i');
    const matchingBranches = branches.searchForLocalBranch(branchRegex);

    if (_.isEmpty(matchingBranches)) {
      execution.print('No branch found matching the regex (make sure you are not already on the target branch!)'.red);

    } else if (matchingBranches.length === 1) {
      execution.execute(`git checkout ${matchingBranches[ 0 ]}`);

    } else {
      const matchingBranchesQuestion = {
        type: QUESTION_TYPES.LIST,
        id: QUESTIONS.CHOOSE_MATCHING_BRANCH,
        message: 'The following branches matched the search, please choose one:\n',
        choices: matchingBranches
      };

      const matchingBranch = await ask(matchingBranchesQuestion);
      execution.execute(`git checkout ${matchingBranch}`);
    }
  }
};

module.exports = {
  ARG_TICKET_NUMBER,
  ARG_BASE,
  ARG_FEATURE,
  ARG_LAST,
  ARG_MASTER,
  ARG_REGEX,
  ARG_TARGET,
  ARG_VERSION,

  command,
  aliases,
  describe,
  builder: switchArgs,
  handler: switchHandler
};
