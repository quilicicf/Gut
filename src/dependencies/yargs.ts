import _yargs from 'https://deno.land/x/yargs@v17.7.2-deno/deno.ts';

// Should be pulled from https://deno.land/x/yargs@v17.3.1-deno/deno-types.ts but it doesn't work in yargs yet
export interface YargsInstance {
  help: () => YargsInstance;
  version: () => YargsInstance;
  strictCommands: () => YargsInstance;
  check: (param: unknown) => YargsInstance;
  wrap: (param: unknown) => YargsInstance;
  parse: (params: unknown) => YargsInstance;
  usage: (usage: string) => YargsInstance;
  epilogue: (epilogue: string) => YargsInstance;
  command: (command: unknown) => YargsInstance;
  option: (name: string, option: YargsOption) => YargsInstance;
  positional: (name: string, option: YargsOption) => YargsInstance;
  demandCommand: (number: number, message: string) => YargsInstance;
}

// @ts-ignore TS-2554 The arguments are optional FFS
export const yargs: YargsInstance = _yargs();

export interface YargsOption {
  type: 'integer' | 'boolean' | 'string' | 'number';
  describe?: string;
  alias?: string;
  global?: boolean;
  hidden?: boolean;
  default?: unknown;
  choices?: unknown[];
  implies?: string[];
  conflicts?: string[];
  requiresArg?: boolean;
  demandOption?: boolean;
  isPositionalOption?: boolean;
  coerce?: (input: string) => unknown,
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
  extraPermissions: ExtraPermissions;
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

export function bindOptionsAndCreateUsage (_yargs: YargsInstance, usage: string, options: YargsOptions): YargsInstance {
  const reducer = function (seed: YargsInstance, [ name, option ]: [ name: string, option: YargsOption ]): YargsInstance {
    const positionalOption: boolean = option.isPositionalOption || false;
    return positionalOption
      ? seed.positional(name, option) as YargsInstance
      : seed.option(name, option) as YargsInstance;
  };

  return Object.entries(options)
    .reduce(reducer, _yargs as YargsInstance)
    .usage(usage)
    .help();
}
