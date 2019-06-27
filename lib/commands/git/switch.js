const _ = require('lodash');

const path = require('path');

const branches = require('../../utils/branches');
const execution = require('../../utils/execution');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [ command.charAt(0) ];
const describe = 'Checks out a branch';

const QUESTIONS = {
  CHOOSE_EMOJI: 'lib/git/switch:choose_branch',
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
  name: 'base',
  alias: 'b',
  describe: 'Switch to base branch',
  type: 'boolean',
};

const ARG_LAST = {
  name: 'last',
  alias: 'l',
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

const askWhereToSwitch = async () => {
  const currentBranchName = branches.getCurrentBranchName();
  const switchableRefs = _.filter(
    branches.getAllRefs(),
    branchName => branchName !== currentBranchName,
  );

  const question = {
    type: QUESTION_TYPES.AUTO_COMPLETE,
    id: QUESTIONS.CHOOSE_BRANCH,
    message: 'Choose the branch you want to switch on: ',
    async source (answers, search = '') {
      return _.filter(
        switchableRefs,
        switchableRef => switchableRef.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      );
    },
    pageSize: 10,
  };

  return switchToBranch(await ask(question));
};

const switchArgs = yargs => (
  yargs
    .usage(`usage: gut ${command} [options]`)
    .option(ARG_MASTER.name, ARG_MASTER)
    .option(ARG_VERSION.name, ARG_VERSION)
    .option(ARG_FEATURE.name, ARG_FEATURE)
    .option(ARG_BASE.name, ARG_BASE)
    .option(ARG_LAST.name, ARG_LAST)
    .help()
);

const switchHandler = async (args) => {
  const {
    m: toMaster,
    v: toVersion,
    f: toFeature,
    b: toBase,
    l: toLast,
  } = args;

  if (toMaster) { return switchToMaster(); }
  if (toLast) { return switchToLast(); }

  const branchDescription = branches.getBranchDescription();
  if (toVersion) { return switchToBranch(branchDescription.version); }
  if (toFeature) { return switchToFeature(branchDescription); }
  if (toBase) { return switchToBase(branchDescription); }

  return askWhereToSwitch();
};

module.exports = {
  ARG_BASE,
  ARG_FEATURE,
  ARG_LAST,
  ARG_MASTER,
  ARG_VERSION,

  command,
  aliases,
  describe,
  builder: switchArgs,
  handler: switchHandler,
};
