const _ = require('lodash');

const path = require('path');

const { CI_TOOLS } = require('../../utils/ciTools');

const configuration = require('../../utils/configuration');
const execution = require('../../utils/execution');
const { QUESTION_TYPES, ask } = require('../../utils/prompt');

const command = path.parse(__filename).name;
const aliases = [];
const describe = 'Interact with your CI tool';

const COMMAND_DOCUMENTATION = 'https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md#ci';

const QUESTIONS = {
  CONFIRM_RUN_JOB: 'lib/advanced/ci:confirm_run_job',
  CHOOSE_JOB_TO_RUN: 'lib/advanced/ci:choose_job_to_run'
};

const executeJob = (job, toolConfigurations, accounts) => {
  const ciTool = CI_TOOLS[ job.ciToolName ];

  if (!ciTool) {
    execution.exit(1, `The CI tool ${ciTool} is not supported at the moment.\n` +
      `Maybe this is a typo in your repository configuration file? Please have a look at ${COMMAND_DOCUMENTATION}`);
  }

  const ciUser = accounts[ job.ciToolName ];

  if (!ciUser) {
    execution.exit(1, `No user configured for CI tool ${job.ciToolName}. Please have a look at ${COMMAND_DOCUMENTATION}`);
  }

  const toolConfiguration = toolConfigurations[ job.ciToolName ];

  if (!toolConfiguration) {
    execution.exit(1, `CI tool ${job.ciToolName} is not configured in the global options. Please have a look at ${COMMAND_DOCUMENTATION}`);
  }

  const serverUri = toolConfiguration.servers[ job.server ];

  if (!serverUri) {
    execution.exit(1, `Server ${job.server} is not defined in global configuration. Please have a look at ${COMMAND_DOCUMENTATION}`);
  }

  ciTool.executeJob(job, serverUri, ciUser);
};

const ciArgs = (yargs) => {
  return yargs.usage(`usage: gut ${command} [options]`)
    .help();
};

const ciHandler = async () => {
  const ciConfigurations = configuration.getRepositoryOption(configuration.REPOSITORY_OPTIONS_STRUCTURE.CI);
  const accounts = configuration.getGlobalOption(configuration.GLOBAL_OPTIONS_STRUCTURE.ACCOUNTS);
  const toolConfigurations = configuration.getGlobalOption(configuration.GLOBAL_OPTIONS_STRUCTURE.TOOLS);
  const allJobs = _(ciConfigurations)
    .map((ciConfiguration, ciToolName) => {
      return _.toPairs(ciConfiguration)
        .map((jobConfigurationPair) => {
          const jobConfiguration = jobConfigurationPair[ 1 ];
          jobConfiguration.ciToolName = ciToolName;
          return [ jobConfigurationPair[ 0 ], jobConfiguration ];
        });
    })
    .flatten()
    .fromPairs()
    .value();

  const jobsSize = _.size(allJobs);
  if (jobsSize === 0) {
    execution.exit(0, 'There are no configured jobs for this repository.');

  } else if (jobsSize === 1) {
    const jobKey = _.keys(allJobs)[ 0 ];
    const job = _.values(allJobs)[ 0 ];

    const question = {
      type: QUESTION_TYPES.BOOLEAN,
      id: QUESTIONS.CONFIRM_RUN_JOB,
      message: `Do you want to run job ${jobKey.cyan}?`,
      default: true
    };
    const shouldRun = await ask(question);
    if (shouldRun) {
      executeJob(job, toolConfigurations, accounts);
    }

  } else {
    const chooseJobQuestion = {
      type: QUESTION_TYPES.LIST,
      id: QUESTIONS.CHOOSE_JOB_TO_RUN,
      message: 'Which job do you want to run?\n',
      choices: _.keys(allJobs)
    };

    const jobToRun = await ask(chooseJobQuestion);
    executeJob(allJobs[ jobToRun ], toolConfigurations, accounts);
  }
};

module.exports = {
  QUESTIONS,

  command,
  aliases,
  describe,
  builder: ciArgs,
  handler: ciHandler
};