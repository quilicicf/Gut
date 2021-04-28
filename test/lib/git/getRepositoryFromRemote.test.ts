import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRemote, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getRepositoryFromRemote } from '../../../src/lib/git/getRepositoryFromRemote.ts';
import { executeAndGetStdout } from '../../../src/lib/exec/executeAndGetStdout.ts';

Deno.test({
  name: applyStyle(__`@int ${`${LOCATION}/getRepositoryFromRemote`}`, [ theme.strong ]),
  ignore: true, // FIXME: how to create a repository with an SSH remote locally?
  async fn () {
    await startTestLogs();
    const repository = await initializeRepository('gut_test_getRepositoryFromRemote');
    const currentGitUser = await executeAndGetStdout(
      [ 'git', 'config', 'user.name' ],
      { shouldTruncateTrailingLineBreak: true },
    );

    await commitShit(repository, 1);

    const noName = await getRepositoryFromRemote();

    const originRepository = await initializeRemote(repository, 'origin');
    const upstreamRepository = await initializeRemote(repository, 'upstream');

    const repositoryNameFromOrigin = await getRepositoryFromRemote();
    const repositoryNameFromUpstream = await getRepositoryFromRemote('upstream');

    await deleteRepositories(repository, originRepository, upstreamRepository);

    assertEquals(noName, { name: '', owner: '' });
    assertEquals(repositoryNameFromOrigin, { name: originRepository.name, owner: currentGitUser });
    assertEquals(repositoryNameFromUpstream, { name: upstreamRepository.name, owner: currentGitUser });
    await endTestLogs();
  },
});
