/**
 * To format int values into floats
 * @param value Value number
 * @returns The formatted value
 */
export const formatToFloatValueReal = (value: number): string => {
  return (value / 100).toLocaleString('pt-br', {
    style: 'currency',
    currency: 'BRL',
  });
};
