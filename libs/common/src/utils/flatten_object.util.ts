import { isObject } from 'class-validator';

/**
 * Receive an object with multiple levels and return a value list with one level.
 * @param input The object input
 * @returns The list with values
 */
export const flattenObject = (input: Record<string, any>): string[] =>
  Object.values(input)
    .map((item) => (!isObject(item) ? item : flattenObject(item)))
    .flat();
