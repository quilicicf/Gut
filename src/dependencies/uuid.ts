import { v4 } from 'uuid/mod.ts';

function uuid (): string {
  return v4.generate();
}

export { uuid };
