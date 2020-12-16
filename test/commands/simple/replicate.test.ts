import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { test } from '../../../src/commands/simple/replicate.ts';
import { FullGutConfiguration } from '../../../src/configuration.ts';
import { assertEquals, fail } from '../../utils/assert.ts';
import { set } from '../../../src/dependencies/ramda.ts';

const { buildGitSshUrl } = test;

const GIT_SERVER = 'github';
const OWNER = 'Owner';
const PASSWORD = 'p4sswOrd';
const CONFIGURATION: FullGutConfiguration = {
  global: {
    tools: {
      github: {
        account: { username: OWNER, password: PASSWORD },
      },
    },
    preferredGitServer: GIT_SERVER,
    repositoriesPath: '/tmp/gut_replicate_tests',
  },
};

const command = 'gut replicate';
const REPOSITORY = 'Repo';
Deno.test(applyStyle(__`@unit ${command} should build an SSH URL from arguments`, [ theme.strong ]), async () => {
  const metadata = buildGitSshUrl({
    isTestRun: true,
    server: GIT_SERVER,
    owner: OWNER,
    repository: REPOSITORY,
    configuration: set(CONFIGURATION, [ 'global', 'preferredGitServer' ], 'toto'),
  });

  assertEquals(metadata, {
    server: GIT_SERVER,
    owner: OWNER,
    repository: REPOSITORY,
    sshUrl: 'git@github.com:Owner/Repo.git',
  });
});

Deno.test(applyStyle(__`@unit ${command} should infer preferred git server`, [ theme.strong ]), async () => {
  const { server } = buildGitSshUrl({
    isTestRun: true,
    owner: OWNER,
    repository: REPOSITORY,
    configuration: CONFIGURATION,
  });

  assertEquals(server, GIT_SERVER);
});
Deno.test(applyStyle(__`@unit ${command} should infer owner`, [ theme.strong ]), async () => {
  const { owner } = buildGitSshUrl({
    isTestRun: true,
    repository: REPOSITORY,
    configuration: CONFIGURATION,
  });

  assertEquals(owner, OWNER);
});

Deno.test(applyStyle(__`@unit ${command} should fail with unknown server`, [ theme.strong ]), async () => {
  try {
    buildGitSshUrl({
      isTestRun: true,
      server: 'unknown',
      repository: REPOSITORY,
      configuration: CONFIGURATION,
    });
    fail('Should have failed with unknown server');
  } catch (error) {
    assertEquals(
      error.message,
      applyStyle(
        __`Server ${'unknown'} not configured. Please make sure it is not being implemented and create an issue.`,
        [ theme.strong ],
      ));
  }
});

Deno.test(applyStyle(__`@unit ${command} should fail without owner`, [ theme.strong ]), async () => {
  try {
    buildGitSshUrl({
      isTestRun: true,
      server: GIT_SERVER,
      repository: REPOSITORY,
      configuration: set(CONFIGURATION, [ 'global', 'tools' ], {}),
    });
    fail('Should have failed without owner');
  } catch (error) {
    assertEquals(error.message, 'Cannot replicate a repository without owner');
  }
});
