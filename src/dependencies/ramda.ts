import set from 'ramda/set.js';
import path from 'ramda/path.js';
import isNil from 'ramda/isNil.js';
import isEmpty from 'ramda/isEmpty.js';
import lensPath from 'ramda/lensPath.js';
import mergeDeepRight from 'ramda/mergeDeepRight.js';

/**
 * Weaker than lodash's.
 * - Won't get the right result in case of multi-byte unicode characters in strings.
 * - Won't get the right result in case of ES6 classes.
 */
// deno-lint-ignore no-explicit-any
function size (input: any | unknown[] | string): number {
  if (input === null || input === undefined) { return 0; }
  if (Array.isArray(input) || typeof input === 'string') { return input.length; }
  // @ts-ignore TS-2322 The size is supposed to return an integer
  if ([ '[object Map]', '[object Set]' ].includes(input.toString())) { return input.size; }
  return Object.keys(input).length;
}

// deno-lint-ignore no-explicit-any
function isNilOrEmpty (input: any | unknown[] | string): boolean {
  return isNil(input) || isEmpty(input);
}

function setPath (input: unknown, _path: unknown[], value: unknown) {
  const lens = lensPath(_path);
  return set(lens, value, input);
}

function padRight (string: string, length: number, paddingChar: string = ' ') {
  if (isNaN(length)) { return string; }
  if (string.length >= length) { return string; }
  const padding = new Array(length - string.length)
    .fill(paddingChar)
    .join('');
  return `${string}${padding}`;
}

function padLeft (string: string, length: number, paddingChar: string = ' ') {
  if (string.length >= length) { return string; }
  const padding = new Array(length - string.length)
    .fill(paddingChar)
    .join('');
  return `${padding}${string}`;
}

function pad (string: string, length: number, paddingChar: string = ' ') {
  if (string.length >= length) { return string; }
  const paddingSize = length - string.length;
  const halfPaddingSize = Math.trunc(paddingSize / 2);
  const paddedLeft = padLeft(string, string.length + halfPaddingSize, paddingChar);
  return padRight(paddedLeft, length, paddingChar);
}

export {
  pad,
  padLeft,
  padRight,
  path,
  size,
  setPath as set,
  isNilOrEmpty as isEmpty,
  mergeDeepRight,
};
