import { Input, InputOptions } from 'https://deno.land/x/cliffy@v0.17.0/prompt/input.ts';
import { Select, SelectOptions, SelectOption as _SelectOption } from 'https://deno.land/x/cliffy@v0.17.0/prompt/select.ts';

export type StringOptions = InputOptions;

export async function promptString (options: InputOptions) {
  return Input.prompt(options);
}

export type SelectOption = _SelectOption;

export async function promptSelect (options: SelectOptions) {
  return Select.prompt(options);
}
