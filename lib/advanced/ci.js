const _ = require('lodash');

const { CI_TOOLS } = require('../utils/ciTools');

const configuration = require('../utils/configuration');
const execution = require('../utils/execution');
const prompt = require('../utils/prompt');

module.exports = (() => {
  const COMMAND_DOCUMENTATION = 'https://github.com/quilicicf/Gut/blob/master/specs/user_documentation.md#ci';

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

  return {
    ci: () => {
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
        prompt.yesNoPrompt({ message: `Do you want to run job ${jobKey.cyan}?`, defaultValue: true })
          .then((choice) => {
            if (choice) {
              executeJob(job, toolConfigurations, accounts);
            }
          });

      } else {
        prompt.chooseFromList('Which job do you want to run?\n', _.keys(allJobs))
          .then((choice) => {
            executeJob(allJobs[ choice ], toolConfigurations, accounts);
          });
      }
    }
  };
})();
