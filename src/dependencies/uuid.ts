import { v4 } from 'https://deno.land/std@0.86.0/uuid/mod.ts';

function uuid (): string {
  return v4.generate();
}

export { uuid };
