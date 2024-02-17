import { formatValueFromIntToFloat } from './format_value_from_int_to_float.util';

/**
 * To format int values into floats
 * @param value Value number
 * @returns The formatted value
 */
export const formatValueFromIntBpsToFloat = (value: number): number => {
  return formatValueFromIntToFloat(value, 4);
};
