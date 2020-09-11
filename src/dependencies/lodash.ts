/**
 * Weaker than lodash's.
 * - Won't get the right result in case of multi-byte unicode characters in strings.
 * - Won't get the right result in case of ES6 classes.
 */
export function _size (input: object | any[] | string): number {
  if (input === null || input === undefined) { return 0; }
  if (Array.isArray(input) || typeof input === 'string') { return input.length; }
  // @ts-ignore
  if ([ '[object Map]', '[object Set]' ].includes(input.toString())) { return input.size; }
  return Object.keys(input).length;
}

export function _isEmpty (input: object | any[] | string): boolean {
  return _size(input) === 0;
}
