import { getMoment } from '@zro/common';

export const isHourInRange = (startHour: string, endHour: string): boolean => {
  const startDate = getMoment(startHour, 'HH:mm');
  const endDate = getMoment(endHour, 'HH:mm');

  return getMoment().isBetween(startDate, endDate);
};
