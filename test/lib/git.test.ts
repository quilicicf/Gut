import { __, applyStyle, theme } from '../../src/dependencies/colors.ts';

import { fail, assertEquals } from '../utils/assert.ts';
import { Commit, LOG_FORMATS } from '../../src/lib/git.ts';

const testCommit: Commit = {
  sha: '49cd5b309e581061536bb0895cea53ae85acfcb0',
  author: 'quilicicf',
  subject: ':new: Creating something',
  relativeDate: '11 days ago',
  branches: [
    'HEAD -> master',
    'origin/master',
  ],
};
const testedUnit = 'utils/git';

Deno.test(applyStyle(__`@unit ${testedUnit} should color commits with formats`, [ theme.strong ]), () => {
  const expected: { [ key: string ]: string } = {
    JSON: `${JSON.stringify([ testCommit ])}\n`,
    SHA: `${testCommit.sha}\n`,
    SUBJECT: `${testCommit.subject}\n`,
    SIMPLE: '\x1b[38;2;249;38;114m49cd5b3\x1b[0m :new: Creating something \x1b[38;2;102;217;239;1m<quilicicf>\x1b[0m\n',
    PRETTY: [
      '\x1b[38;2;249;38;114m49cd5b309e581061536bb0895cea53ae85acfcb0\x1b[0m\n',
      '\t:new: Creating something \x1b[38;2;166;226;46m(11 days ago)\x1b[0m \x1b[38;2;102;217;239;1m<quilicicf>\x1b[0m\n',
      '\t\x1b[38;2;230;219;116m(HEAD -> master, origin/master)\x1b[0m\n',
    ].join(''),
  };

  Object.entries(LOG_FORMATS)
    .forEach(([ key, value ]) => {
      if (!expected[ key ]) { fail(`The log format ${key} is not tested yet, it should be`); }
      const formattedCommit = value([ testCommit ]);
      assertEquals(formattedCommit, expected[ key ]);
    });
});
