export const formatIof = (iof: number): string => {
  const iofBy100 = iof / 100;
  const iofFixed = iofBy100.toFixed(2);

  return `${iofFixed}%`;
};
