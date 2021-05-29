import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import {
  commitShit,
  deleteRepositories, endTestLogs, initializeRemote, initializeRepository, startTestLogs,
} from '../../utils/setup.ts';
import { LOCATION } from './git.utils.ts';
import { assertEquals } from '../../utils/assert.ts';

import { getRemotes } from '../../../src/lib/git/getRemotes.ts';

Deno.test(stoyle`@int ${`${LOCATION}/getRemotes`}`({ nodes: [ theme.strong ] }), async () => {
  await startTestLogs();
  const repository = await initializeRepository('gut_test_getRemotes');

  await commitShit(repository, 1);

  const noRemotes = await getRemotes();

  const originRepository = await initializeRemote(repository, 'origin');
  const upstreamRepository = await initializeRemote(repository, 'upstream');

  const remotes = await getRemotes();

  await deleteRepositories(repository, originRepository, upstreamRepository);

  assertEquals(noRemotes, []);
  assertEquals(remotes, [ 'origin', 'upstream' ]);
  await endTestLogs();
});
