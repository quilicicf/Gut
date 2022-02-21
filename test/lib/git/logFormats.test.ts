import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { TEST_COMMIT, LOCATION } from './git.utils.ts';
import { LOG_FORMATS } from '../../../src/lib/git/logFormats.ts';

import { fail, assertEquals } from '../../utils/assert.ts';

Deno.test(stoyle`@unit ${`${LOCATION}/logFormats`}`({ nodes: [ theme.strong ] }), () => {
  const expected: { [ key: string ]: string } = {
    JSON: `${JSON.stringify([ TEST_COMMIT ])}\n`,
    SHA: `${TEST_COMMIT.sha}\n`,
    SUBJECT: `${TEST_COMMIT.subject}\n`,
    SIMPLE: '\x1b[38;2;249;38;114m49cd5b3\x1b[0m :new: Creating something \x1b[38;2;102;217;239;1m<quilicicf>\x1b[0m\n',
    PRETTY: [
      '\x1b[38;2;249;38;114m49cd5b309e581061536bb0895cea53ae85acfcb0\x1b[0m',
      '\t:new: Creating something \x1b[38;2;166;226;46m(11 days ago)\x1b[0m \x1b[38;2;102;217;239;1m<quilicicf>\x1b[0m',
      '\t\x1b[38;2;230;219;116m(HEAD -> master, origin/master)\x1b[0m',
      '',
    ].join('\n'),
  };

  Object.entries(LOG_FORMATS)
    .forEach(([ key, value ]) => {
      if (!expected[ key ]) { fail(`The log format ${key} is not tested yet, it should be`); }
      const formattedCommit = value([ TEST_COMMIT ]);
      assertEquals(formattedCommit, expected[ key ]);
    });
});
