import yargs from 'https://deno.land/x/yargs@v16.2.0-deno/deno.ts';

interface _YargsOption {
  describe: string;
  type: 'integer' | 'boolean' | 'string' | 'number';
  alias?: string;
  default?: any;
  choices?: any[];
  implies?: string[];
  conflicts?: string[];
  requiresArg?: boolean;
  demandOption?: boolean;
  isPositionalOption?: boolean;
  coerce?: (input: string) => any,
}

export type YargsOption = _YargsOption;
export type YargsOptions = { [ key: string ]: _YargsOption };

const toYargsUsage = (command: string, options: YargsOptions) => {
  const positionalOptionNames = Object.entries(options)
    .filter(([ , option ]) => option.isPositionalOption)
    .map(([ name ]) => `[${name}]`) // Note: assumes all positional options are optional, otherwise wrap in <>
    .join(' ');

  return positionalOptionNames
    ? `USAGE: gut ${command} ${positionalOptionNames} [options...]`
    : `USAGE: gut ${command} [options...]`;
};

const bindOptionsAndCreateUsage = (_yargs: any, command: string, usage: string, options: YargsOptions): any => {
  return Object.entries(options)
    .reduce((seed, [ name, option ]) => (
      option.isPositionalOption
        ? seed.positional(name, option)
        : seed.option(name, option)
    ), _yargs)
    .usage(usage);
};

export { yargs, toYargsUsage, bindOptionsAndCreateUsage };
