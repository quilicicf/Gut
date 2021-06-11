import yargs from 'https://deno.land/x/yargs@v17.0.1-deno/deno.ts';

export { yargs };

export interface YargsOption {
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

export type YargsOptions = { [ key: string ]: YargsOption };

interface Permission {
  value: string;
  description: string;
}

export interface ExtraPermissions {
  '--allow-read'?: Permission;
  '--allow-write'?: Permission;
  '--allow-env'?: Permission;
  '--allow-net'?: Permission;
  '--allow-run'?: Permission;
}

export interface Command {
  command: string;
  baseCommand: string;
  describe: string;
  usage: string;
  options: YargsOptions;
  extraPermissions: ExtraPermissions
}

export function toYargsCommand (baseCommand: string, options: YargsOptions): string {
  const positionalOptionNames = Object.entries(options)
    .filter(([ , option ]) => option.isPositionalOption)
    .map(([ name ]) => `[${name}]`) // Note: assumes all positional options are optional, otherwise wrap in <>
    .join(' ');

  return positionalOptionNames
    ? `${baseCommand} ${positionalOptionNames}`
    : baseCommand;
}

export function toYargsUsage (baseCommand: string, options: YargsOptions): string {
  return `USAGE: gut ${toYargsCommand(baseCommand, options)} [options...]`;
}

export function bindOptionsAndCreateUsage (_yargs: any, usage: string, options: YargsOptions): any {
  return Object.entries(options)
    .reduce((seed, [ name, option ]) => (
      option.isPositionalOption
        ? seed.positional(name, option)
        : seed.option(name, option)
    ), _yargs)
    .usage(usage)
    .help();
}
