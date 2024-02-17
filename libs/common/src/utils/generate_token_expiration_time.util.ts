import { getMoment } from '@zro/common';

export const generateTokenExpirationTime = (): Date =>
  getMoment().add(30, 'minutes').toDate();
