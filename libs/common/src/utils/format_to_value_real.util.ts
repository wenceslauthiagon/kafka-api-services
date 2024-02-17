/**
 * To format values in BRL string
 * @param value Value number
 * @returns The formatted value
 */
export const formatToValueReal = (value: number): string => {
  return value.toLocaleString('pt-br', {
    style: 'currency',
    currency: 'BRL',
  });
};
