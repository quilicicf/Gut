import get from 'https://deno.land/x/lodash@4.17.19/npm-package/fp/get.js';
import drop from 'https://deno.land/x/lodash@4.17.19/npm-package/fp/drop.js';
import each from 'https://deno.land/x/lodash@4.17.19/npm-package/fp/each.js';
import flow from 'https://deno.land/x/lodash@4.17.19/npm-package/fp/flow.js';
import filter from 'https://deno.land/x/lodash@4.17.19/npm-package/fp/filter.js';

export function _get (container: object | any[], path: string[]): any {
  return get(container, path);
}

export function _flow (...functions: Function[]): (initial: any) => any {
  return flow(...functions);
}

export function _drop (itemsToDrop: number): (array: any[]) => any {
  return drop(itemsToDrop);
}

export function _each (iteratee: (item: any) => void): (arrayOrObject: any[] | object) => void {
  return each(iteratee);
}

export function _filter (iteratee: (item: any) => boolean): (arrayOrObject: any[] | object) => any[] | object {
  return filter(iteratee);
}
