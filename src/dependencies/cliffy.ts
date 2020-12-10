import { Input, InputOptions } from 'https://deno.land/x/cliffy@v0.16.0/prompt/input.ts';

export type StringOptions = InputOptions;

export async function promptString (options: InputOptions) {
  return Input.prompt(options);
}
