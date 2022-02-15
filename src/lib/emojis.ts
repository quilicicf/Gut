import { stoyle, theme } from '../dependencies/stoyle.ts';
import { SelectOption } from '../dependencies/cliffy.ts';

export const EMOJIS: Record<string, SelectOption> = {
  NEW: { value: ':new:', name: stoyle`${':new:'} when adding a feature`({ nodes: [ theme.strong ] }) },
  UP: { value: ':up:', name: stoyle`${':up:'} when improving a feature`({ nodes: [ theme.strong ] }) },
  MEMO: { value: ':memo:', name: stoyle`${':memo:'} when writing docs`({ nodes: [ theme.strong ] }) },
  CALENDAR: { value: ':calendar:', name: stoyle`${':calendar:'} when planning something (specs/roadmap/TODO)`({ nodes: [ theme.strong ] }) },
  GREEN_HEART: { value: ':green_heart:', name: stoyle`${':green_heart:'} when fixing the CI build`({ nodes: [ theme.strong ] }) },
  PENGUIN: { value: ':penguin:', name: stoyle`${':penguin:'} when fixing something on Linux`({ nodes: [ theme.strong ] }) },
  APPLE: { value: ':apple:', name: stoyle`${':apple:'} when fixing something on Mac OS`({ nodes: [ theme.strong ] }) },
  CHECKERED_FLAG: { value: ':checkered_flag:', name: stoyle`${':checkered_flag:'} when fixing something on Windows`({ nodes: [ theme.strong ] }) },
  BUG: { value: ':bug:', name: stoyle`${':bug:'} when fixing a bug`({ nodes: [ theme.strong ] }) },
  ARROW_UP: { value: ':arrow_up:', name: stoyle`${':arrow_up:'} when upgrading dependencies`({ nodes: [ theme.strong ] }) },
  ARROW_DOWN: { value: ':arrow_down:', name: stoyle`${':arrow_down:'} when downgrading dependencies`({ nodes: [ theme.strong ] }) },
  LOCK: { value: ':lock:', name: stoyle`${':lock:'} when improving security`({ nodes: [ theme.strong ] }) },
  WRENCH: { value: ':wrench:', name: stoyle`${':wrench:'} when improving the tooling`({ nodes: [ theme.strong ] }) },
  TRIANGULAR_RULER: { value: ':triangular_ruler:', name: stoyle`${':triangular_ruler:'} when improving the format/structure of the code`({ nodes: [ theme.strong ] }) },
  ART: { value: ':art:', name: stoyle`${':art:'} when improving styling`({ nodes: [ theme.strong ] }) },
  SHOWER: { value: ':shower:', name: stoyle`${':shower:'} when removing code or files`({ nodes: [ theme.strong ] }) },
  WHITE_CHECK_MARK: { value: ':white_check_mark:', name: stoyle`${':white_check_mark:'} when adding/improving tests`({ nodes: [ theme.strong ] }) },
  SHIRT: { value: ':shirt:', name: stoyle`${':shirt:'} when removing linter warnings`({ nodes: [ theme.strong ] }) },
  RACEHORSE: { value: ':racehorse:', name: stoyle`${':racehorse:'} when improving performance`({ nodes: [ theme.strong ] }) },
  NON_POTABLE_WATER: { value: ':non-potable_water:', name: stoyle`${':non-potable_water:'} when plugging memory leaks`({ nodes: [ theme.strong ] }) },
  EYES: { value: ':eyes:', name: stoyle`${':eyes:'} when processing code-review comments`({ nodes: [ theme.strong ] }) },
  CONSTRUCTION: { value: ':construction:', name: stoyle`${':construction:'} when bumping versions and such`({ nodes: [ theme.strong ] }) },
  BAR_CHART: { value: ':bar_chart:', name: stoyle`${':bar_chart:'} when improving usage statistics gathering`({ nodes: [ theme.strong ] }) },
  UMBRELLA: { value: ':umbrella:', name: stoyle`${':umbrella:'} when improving security`({ nodes: [ theme.strong ] }) },
  MUTE: { value: ':mute:', name: stoyle`${':mute:'} when removing notifications/logs`({ nodes: [ theme.strong ] }) },
  SOUND: { value: ':sound:', name: stoyle`${':sound:'} when adding notifications/logs`({ nodes: [ theme.strong ] }) },
};

export const EMOJIS_SELECTION: SelectOption[] = Object.values(EMOJIS);
