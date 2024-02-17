import { getMoment } from '@zro/common';

/**
 * Convert date to format 'YYYY-MM-DD'.
 *
 * @param date Date to be converted to day.
 * @returns Returns the formatted date.
 */
export const formatToYearMonthDay = (date: Date): string => {
  return date && getMoment(date).format('YYYY-MM-DD');
};
