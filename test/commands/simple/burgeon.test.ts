import { stoyle, theme } from '../../../src/dependencies/stoyle.ts';

import { assertEquals } from '../../utils/assert.ts';
import { test } from '../../../src/commands/simple/burgeon.ts';

const { capFirst, camelCase } = test;

const command = 'gut burgeon';

Deno.test(stoyle`@unit ${command} should capitalize words`({ nodes: [ theme.strong ] }), () => {
  const output = capFirst('tOTO');
  assertEquals(output, 'Toto');
});

Deno.test(stoyle`@unit ${command} should camel-case description`({ nodes: [ theme.strong ] }), () => {
  const output = camelCase(' TITI taTa ToTO');
  assertEquals(output, 'titiTataToto');
});
