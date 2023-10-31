import { exists } from 'fs/exists.ts';
import { detect, EOL } from 'fs/eol.ts';
import { ensureDir } from 'fs/ensure_dir.ts';
import { ensureFile } from 'fs/ensure_file.ts';
import { walk, WalkOptions as _WalkOptions } from 'fs/walk.ts';

export type WalkOptions = _WalkOptions;

export {
  detect,
  exists,
  ensureDir,
  ensureFile,
  EOL,
  walk,
};
