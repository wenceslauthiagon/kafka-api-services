import { isDefined, isNumber } from 'class-validator';

/**
 * To convert the float number or string to an int number.
 * If it is not a valid number, returns the unconverted value.
 * @param value The float number
 * @param [decimals] The precision
 * @returns
 */
export function formatValueFromFloatToInt(
  value: string | number,
  decimals = 2,
): number {
  if (isDefined(value) && isNumber(Number(value))) {
    return Math.floor(
      0.5 + parseFloat(value.toString()) * Math.pow(10, decimals),
    );
  }
  return 0;
}
