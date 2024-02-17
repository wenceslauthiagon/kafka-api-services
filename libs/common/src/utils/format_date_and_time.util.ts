import { getMoment } from '@zro/common';

/**
 * To format Date into Date - Time
 * @param date Date
 * @returns The formatted Date
 */
export const formatDateAndTime = (date: Date, format: string): string => {
  return getMoment(date).format(format);
};
