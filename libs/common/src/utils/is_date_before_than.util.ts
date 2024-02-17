import { getMoment } from '@zro/common/utils/get_moment.util';

export const isDateBeforeThan = (date: Date): boolean =>
  getMoment(date).isBefore(getMoment());
