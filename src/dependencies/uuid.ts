import { v4 } from 'https://deno.land/std/uuid/mod.ts';

function uuid (): string {
  return v4.generate();
}

export { uuid };
