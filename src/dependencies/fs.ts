import { exists } from 'https://deno.land/std@0.92.0/fs/exists.ts';
import { detect, EOL } from 'https://deno.land/std@0.92.0/fs/eol.ts';
import { ensureDir } from 'https://deno.land/std@0.92.0/fs/ensure_dir.ts';
import { ensureFile } from 'https://deno.land/std@0.92.0/fs/ensure_file.ts';
import { walk, WalkOptions as _WalkOptions } from 'https://deno.land/std@0.92.0/fs/walk.ts';

export type WalkOptions = _WalkOptions;

export {
  detect,
  exists,
  ensureDir,
  ensureFile,
  EOL,
  walk,
};
