/**
 * To format int values into floats
 * @param value Value number
 * @returns The formatted value
 */
export const formatValueFromIntToFloat = (
  value: number,
  decimals = 2,
): number => {
  return value / Math.pow(10, decimals);
};
