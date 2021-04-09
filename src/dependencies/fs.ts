import { exists } from 'https://deno.land/std@0.92.0/fs/exists.ts';
import { detect, EOL } from 'https://deno.land/std@0.92.0/fs/eol.ts';
import { walk, WalkOptions as _WalkOptions } from 'https://deno.land/std@0.92.0/fs/walk.ts';

export type WalkOptions = _WalkOptions;

export {
  detect,
  exists,
  EOL,
  walk,
};
