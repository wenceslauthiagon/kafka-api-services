import * as crypto from 'crypto';

export const createRandomCode = (length: number): string =>
  crypto
    .randomBytes(length)
    .toJSON()
    .data.map((x) => `${x % 10}`)
    .join('');
