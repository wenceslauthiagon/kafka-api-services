/**
 * To format values in pt-BRL string
 * @param value Value number
 * @returns The formatted value
 */
export const formatValueFromFloatToEnUsString = (value: number): string => {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 18,
  });
};
