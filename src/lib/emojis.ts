import { __, theme, applyStyle } from '../dependencies/colors.ts';
import { SelectOption } from '../dependencies/cliffy.ts';

export const EMOJIS: SelectOption[] = [
  { value: ':new:', name: applyStyle(__`${':new:'} when adding a feature`, [ theme.strong ]) },
  { value: ':up:', name: applyStyle(__`${':up:'} when improving a feature`, [ theme.strong ]) },
  { value: ':memo:', name: applyStyle(__`${':memo:'} when writing docs`, [ theme.strong ]) },
  { value: ':calendar:', name: applyStyle(__`${':calendar:'} when planning something (specs/roadmap/TODO)`, [ theme.strong ]) },
  { value: ':green_heart:', name: applyStyle(__`${':green_heart:'} when fixing the CI build`, [ theme.strong ]) },
  { value: ':penguin:', name: applyStyle(__`${':penguin:'} when fixing something on Linux`, [ theme.strong ]) },
  { value: ':apple:', name: applyStyle(__`${':apple:'} when fixing something on Mac OS`, [ theme.strong ]) },
  { value: ':checkered_flag:', name: applyStyle(__`${':checkered_flag:'} when fixing something on Windows`, [ theme.strong ]) },
  { value: ':bug:', name: applyStyle(__`${':bug:'} when fixing a bug`, [ theme.strong ]) },
  { value: ':arrow_up:', name: applyStyle(__`${':arrow_up:'} when upgrading dependencies`, [ theme.strong ]) },
  { value: ':arrow_down:', name: applyStyle(__`${':arrow_down:'} when downgrading dependencies`, [ theme.strong ]) },
  { value: ':lock:', name: applyStyle(__`${':lock:'} when improving security`, [ theme.strong ]) },
  { value: ':wrench:', name: applyStyle(__`${':wrench:'} when improving the tooling`, [ theme.strong ]) },
  { value: ':triangular_ruler:', name: applyStyle(__`${':triangular_ruler:'} when improving the format/structure of the code`, [ theme.strong ]) },
  { value: ':art:', name: applyStyle(__`${':art:'} when improving styling`, [ theme.strong ]) },
  { value: ':shower:', name: applyStyle(__`${':shower:'} when removing code or files`, [ theme.strong ]) },
  { value: ':white_check_mark:', name: applyStyle(__`${':white_check_mark:'} when adding/improving tests`, [ theme.strong ]) },
  { value: ':shirt:', name: applyStyle(__`${':shirt:'} when removing linter warnings`, [ theme.strong ]) },
  { value: ':racehorse:', name: applyStyle(__`${':racehorse:'} when improving performance`, [ theme.strong ]) },
  { value: ':non-potable_water:', name: applyStyle(__`${':non-potable_water:'} when plugging memory leaks`, [ theme.strong ]) },
  { value: ':eyes:', name: applyStyle(__`${':eyes:'} when processing code-review comments`, [ theme.strong ]) },
  { value: ':construction:', name: applyStyle(__`${':construction:'} when bumping versions and such`, [ theme.strong ]) },
  { value: ':bar_chart:', name: applyStyle(__`${':bar_chart:'} when improving usage statistics gathering`, [ theme.strong ]) },
  { value: ':umbrella:', name: applyStyle(__`${':umbrella:'} when improving security`, [ theme.strong ]) },
  { value: ':mute:', name: applyStyle(__`${':mute:'} when removing notifications/logs`, [ theme.strong ]) },
  { value: ':sound:', name: applyStyle(__`${':sound:'} when adding notifications/logs`, [ theme.strong ]) },
];