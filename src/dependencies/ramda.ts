import set from 'https://raw.githubusercontent.com/ramda/ramda/81368c9ddcd02fc8c74c46af2da021a0a90c36f8/source/set.js';
import isNil from 'https://raw.githubusercontent.com/ramda/ramda/81368c9ddcd02fc8c74c46af2da021a0a90c36f8/source/isNil.js';
import isEmpty from 'https://raw.githubusercontent.com/ramda/ramda/81368c9ddcd02fc8c74c46af2da021a0a90c36f8/source/isEmpty.js';
import lensPath from 'https://raw.githubusercontent.com/ramda/ramda/81368c9ddcd02fc8c74c46af2da021a0a90c36f8/source/lensPath.js';
import mergeDeepRight from 'https://raw.githubusercontent.com/ramda/ramda/81368c9ddcd02fc8c74c46af2da021a0a90c36f8/source/mergeDeepRight.js';
// import set from 'https://deno.land/x/ramda/set.js';
// import isNil from 'https://deno.land/x/ramda/isNil.js';
// import isEmpty from 'https://deno.land/x/ramda/isEmpty.js';
// import lensPath from 'https://deno.land/x/ramda/lensPath.js';
// import mergeDeepRight from 'https://deno.land/x/ramda/mergeDeepRight.js';

/**
 * Weaker than lodash's.
 * - Won't get the right result in case of multi-byte unicode characters in strings.
 * - Won't get the right result in case of ES6 classes.
 */
function size (input: any | any[] | string): number {
  if (input === null || input === undefined) { return 0; }
  if (Array.isArray(input) || typeof input === 'string') { return input.length; }
  // @ts-ignore
  if ([ '[object Map]', '[object Set]' ].includes(input.toString())) { return input.size; }
  return Object.keys(input).length;
}

function isNilOrEmpty (input: any | any[] | string): boolean {
  return isNil(input) || isEmpty(input);
}

function setPath (input: any, path: any[], value: any) {
  const lens = lensPath(path);
  return set(lens, value, input);
}

function padRight (string: string, length: number, paddingChar: string = ' ') {
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
  size,
  setPath as set,
  isNilOrEmpty as isEmpty,
};
