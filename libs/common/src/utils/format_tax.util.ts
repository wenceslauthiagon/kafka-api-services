export const formatTax = (value: number, format: string): string => {
  if (format.indexOf('[VALUE]') === -1) {
    throw new Error('Invalid tax format.');
  }

  const valueBy100 = value / 100;
  const valueFixed = valueBy100.toFixed(2);

  return format.replace('[VALUE]', valueFixed);
};
