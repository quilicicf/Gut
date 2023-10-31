import { Input, InputOptions } from 'cliffy/prompt/input.ts';
import { Confirm, ConfirmOptions as _ConfirmOptions } from 'cliffy/prompt/confirm.ts';
import { Select, SelectOptions, SelectOption as _SelectOption } from 'cliffy/prompt/select.ts';

export type StringOptions = InputOptions;

export async function promptString (options: InputOptions) {
  return Input.prompt(options);
}

export type SelectOption = _SelectOption;

export async function promptSelect (options: SelectOptions) {
  return Select.prompt(options);
}

export type ConfirmOptions = _ConfirmOptions;

export function promptConfirm (options: ConfirmOptions) {
  return Confirm.prompt(options);
}
