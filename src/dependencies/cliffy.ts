import { Input, InputOptions } from 'https://deno.land/x/cliffy@v0.17.2/prompt/input.ts';
import { Confirm, ConfirmOptions as _ConfirmOptions } from 'https://deno.land/x/cliffy@v0.17.2/prompt/confirm.ts';
import { Select, SelectOptions, SelectOption as _SelectOption } from 'https://deno.land/x/cliffy@v0.17.2/prompt/select.ts';

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
