import { __, applyStyle, theme } from '../../../src/dependencies/colors.ts';

import { assertEquals } from '../../utils/assert.ts';
import { test } from '../../../src/commands/simple/burgeon.ts';

const { capFirst, camelCase } = test;

const command = 'gut burgeon';

Deno.test(applyStyle(__`@unit ${command} should capitalize words`, [ theme.strong ]), () => {
  const output = capFirst('tOTO');
  assertEquals(output, 'Toto');
});

Deno.test(applyStyle(__`@unit ${command} should camel-case description`, [ theme.strong ]), () => {
  const output = camelCase(' TITI taTa ToTO');
  assertEquals(output, 'titiTataToto');
});
