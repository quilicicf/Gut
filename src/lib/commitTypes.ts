import { SelectOption } from '../dependencies/cliffy.ts';
import { stoyle, theme } from '../dependencies/stoyle.ts';

export const COMMIT_TYPES: Record<string, SelectOption> = {
  FEAT: { value: 'feat', name: stoyle`${'feat'} when working on a feature`({ nodes: [ theme.strong ] }) },
  FIX: { value: 'fix', name: stoyle`${'fix'} when working on a bug fix`({ nodes: [ theme.strong ] }) },
  DOC: { value: 'doc', name: stoyle`${'doc'} when working on documentation`({ nodes: [ theme.strong ] }) },
  TEST: { value: 'test', name: stoyle`${'test'} when working on tests`({ nodes: [ theme.strong ] }) },
  CHORE: { value: 'chore', name: stoyle`${'chore'} when working on anything else`({ nodes: [ theme.strong ] }) },
};

export const COMMIT_TYPES_SELECTION: SelectOption[] = Object.values(COMMIT_TYPES);
