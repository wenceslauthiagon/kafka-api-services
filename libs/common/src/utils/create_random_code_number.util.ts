import * as crypto from 'crypto';

export const createRandomNumberCode = (length: number): string =>
  crypto.randomInt(Math.pow(10, length)).toString().padStart(length, '0');
