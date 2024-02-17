import { formatValueFromFloatToInt } from './format_value_from_float_to_int.util';

/**
 * To format float to int bps.
 * @param value Value number
 * @returns The formatted value
 */
export const formatValueFromFloatToIntBps = (value: number): number => {
  return formatValueFromFloatToInt(value, 4);
};
