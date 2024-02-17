/**
 * To format values in pt-BRL string
 * @param value Value number
 * @returns The formatted value
 */
export const formatValueFromFloatToPtBrlString = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 18,
  });
};
