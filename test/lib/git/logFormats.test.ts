import {
  __, RESET_CODE, applyStyle, theme,
} from '../../../src/dependencies/colors.ts';

import { TEST_COMMIT, LOCATION } from './git.utils.ts';
import { LOG_FORMATS } from '../../../src/lib/git/logFormats.ts';

import { fail, assertEquals } from '../../utils/assert.ts';

Deno.test(applyStyle(__`@unit ${`${LOCATION}/logFormats`}`, [ theme.strong ]), () => {
  const expected: { [ key: string ]: string } = {
    JSON: `${JSON.stringify([ TEST_COMMIT ])}\n`,
    SHA: `${TEST_COMMIT.sha}\n`,
    SUBJECT: `${TEST_COMMIT.subject}\n`,
    SIMPLE: `${theme.sha}49cd5b3${RESET_CODE} :new: Creating something ${theme.author}<quilicicf>${RESET_CODE}\n`,
    PRETTY: [
      `${theme.sha}49cd5b309e581061536bb0895cea53ae85acfcb0${RESET_CODE}`,
      `\t:new: Creating something ${theme.relativeDate}(11 days ago)${RESET_CODE} ${theme.author}<quilicicf>${RESET_CODE}`,
      `\t${theme.branches}(HEAD -> master, origin/master)${RESET_CODE}`,
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
