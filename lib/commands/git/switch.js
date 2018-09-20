const _ = require('lodash');

const path = require('path');

const branches = require('../../utils/branches');
const execution = require('../../utils/execution');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Checks out a branch';

const QUESTIONS = {
  CHOOSE_MATCHING_BRANCH: 'lib/git/switch:choose_matching_branch',
  CHOOSE_BRANCH: 'lib/git/switch:choose_branch',
};

const ARG_TARGET = {
  name: 'target',
  alias: 't',
  describe: 'The target branch',
  type: 'string',
  conflicts: [ 'regex', 'ticket-number' ],
};

const ARG_REGEX = {
  name: 'regex',
  alias: 'r',
  describe: 'A regex to find the branch to check out',
  type: 'string',
  conflicts: [ 'target', 'ticket-number' ],
};

const ARG_TICKET_NUMBER = {
  name: 'ticket-number',
  alias: 'n',
  describe: 'Specifies the ticket number to switch branches',
  type: 'integer',
  conflicts: [ 'target', 'regex' ],
};

const ARG_MASTER = {
  name: 'm',
  describe: 'Switch to master',
  type: 'boolean',
};

const ARG_VERSION = {
  name: 'v',
  describe: 'Switch to the version branch',
  type: 'boolean',
};

const ARG_FEATURE = {
  name: 'f',
  describe: 'Switch to feature branch',
  type: 'boolean',
};

const ARG_BASE = {
  name: 'b',
  describe: 'Switch to base branch',
  type: 'boolean',
};

const ARG_LAST = {
  name: 'l',
  describe: 'Switch to last branch',
  type: 'boolean',
};

const switchToBranch = branchName => execution.execute(`git checkout ${branchName}`);

const switchToMaster = () => switchToBranch('master');

const switchToFeature = (branchDescription) => {
  try {
    const parsedFeatureBranch = branches.getBranchParent(branchDescription, branches.BRANCH_TYPES.FEATURE);
    return switchToBranch(branches.buildBranchName(parsedFeatureBranch));
  } catch (error) {
    return execution.exit(1, `Can't find the feature version from ${branches.getCurrentBranchName()}.`);
  }
};

const switchToBase = (branchDescription) => {
  const parsedBaseBranch = branches.getBranchParent(branchDescription);
  return switchToBranch(branches.buildBranchName(parsedBaseBranch));
};

const switchToLast = () => execution.executeAndPipe('git checkout -');

const switchByRegex = async (regex) => {
  const branchRegex = new RegExp(regex, 'i');
  const matchingBranches = _.filter(
    branches.getAllRefs(),
    branchName => branchRegex.test(branchName),
  );

  if (_.isEmpty(matchingBranches)) {
    return execution.print('No branch found matching the regex (make sure you are not already on the target branch!)'.red);
  }

  if (matchingBranches.length === 1) {
    return switchToBranch(matchingBranches[ 0 ]);
  }

  const matchingBranchesQuestion = {
    type: QUESTION_TYPES.LIST,
    id: QUESTIONS.CHOOSE_MATCHING_BRANCH,
    message: 'The following branches matched the search, please choose one:\n',
    choices: matchingBranches,
  };

  return switchToBranch(await ask(matchingBranchesQuestion));
};

const askWhereToSwitch = async () => {
  const currentBranchName = branches.getCurrentBranchName();
  const switchableRefs = _.filter(
    branches.getAllRefs(),
    branchName => branchName !== currentBranchName,
  );

  const question = {
    type: QUESTION_TYPES.LIST,
    id: QUESTIONS.CHOOSE_BRANCH,
    message: 'Choose the branch you want to switch on:\n',
    choices: switchableRefs,
    pageSize: 10,
  };

  return switchToBranch(await ask(question));
};

const switchArgs = yargs => (
  yargs
    .usage(`usage: gut ${command} [options]`)
    .option(ARG_TARGET.name, ARG_TARGET)
    .option(ARG_REGEX.name, ARG_REGEX)
    .option(ARG_TICKET_NUMBER.name, ARG_TICKET_NUMBER)
    .option(ARG_MASTER.name, ARG_MASTER)
    .option(ARG_VERSION.name, ARG_VERSION)
    .option(ARG_FEATURE.name, ARG_FEATURE)
    .option(ARG_BASE.name, ARG_BASE)
    .option(ARG_LAST.name, ARG_LAST)
    .help()
);

const switchHandler = async (args) => {
  const {
    target,
    regex,
    n: ticketNumber,
    m: toMaster,
    v: toVersion,
    f: toFeature,
    b: toBase,
    l: toLast,
  } = args;

  const branchDescription = branches.getBranchDescription();

  if (toMaster) { return switchToMaster(); }
  if (toVersion) { return switchToBranch(branchDescription.version); }
  if (toFeature) { return switchToFeature(branchDescription); }
  if (toBase) { return switchToBase(branchDescription); }
  if (toLast) { return switchToLast(); }
  if (target) { return switchToBranch(target); }
  if (regex) { return switchByRegex(regex); }
  if (ticketNumber) { return switchByRegex(`^[^_]+_${ticketNumber}_`); }

  return askWhereToSwitch();
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
  handler: switchHandler,
};
