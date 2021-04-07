import { executeAndGetStdout } from '../exec/executeAndGetStdout.ts';

import { REF_TYPES, Refs } from './Refs.ts';

export async function getAllRefs (filterText: string = ''): Promise<Refs> {
  const allRefsAsString = await executeAndGetStdout([ 'git', 'show-ref' ], true);

  const accumulator: Refs = { branches: [], tags: [] };
  const { branches, tags } = allRefsAsString
    .split('\n')
    .map((refAsString) => refAsString.split(' ')[ 1 ])
    .filter((refName) => !REF_TYPES.STASH.detect(refName))
    .reduce(
      (seed, ref) => {
        if (REF_TYPES.HEADS.detect(ref)) {
          seed.branches.push(REF_TYPES.HEADS.extractName(ref));
          return seed;
        }

        if (REF_TYPES.REMOTE.detect(ref)) {
          seed.branches.push(REF_TYPES.REMOTE.extractName(ref));
          return seed;
        }

        if (REF_TYPES.TAG.detect(ref)) {
          seed.tags.push(REF_TYPES.TAG.extractName(ref));
          return seed;
        }

        throw Error(`Unknown ref type for: ${ref}`);
      },
      accumulator,
    );

  const lowerFilterText = filterText.toLocaleLowerCase();
  const filter = lowerFilterText
    ? (ref: string) => ref.toLocaleLowerCase().includes(lowerFilterText) && ref !== 'HEAD'
    : (ref: string) => ref !== 'HEAD';

  function onlyUnique (value: string, index: number, self: string[]) {
    return self.indexOf(value) === index;
  }

  return {
    branches: branches
      .filter(filter)
      .filter(onlyUnique)
      .sort(),
    tags: tags
      .filter(filter)
      .filter(onlyUnique)
      .sort(),
  };
}
