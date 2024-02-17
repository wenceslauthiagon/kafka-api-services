export const formatValue = (value: number): number => {
  return parseFloat((value / 100.0).toFixed(2));
};
