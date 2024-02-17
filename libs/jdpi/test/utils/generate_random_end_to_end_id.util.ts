import { getMoment } from '@zro/common';

export const generateRandomEndToEndId = (): string => {
  // Generate a random number with 8 digits
  const randomNumber = (digits: number) =>
    Math.floor(10 ** (digits - 1) + Math.random() * 9 * 10 ** (digits - 1));

  // Create the timestamp part (YYMMDDHHMM)
  const timestamp = getMoment().format('YYYYMMDDHHmm');

  // Create the end-to-end ID by combining the parts
  const endToEndId = `E${randomNumber(8)}${timestamp}A${randomNumber(10)}`;

  return endToEndId;
};
