/**
 * To format int values with fixed decimals
 * @param value Value number
 * @param [decimals] The precision
 * @returns The formatted value
 */
export const formatValueToFixed = (value: number, decimals = 2): number => {
  return Number(value.toFixed(decimals));
};
