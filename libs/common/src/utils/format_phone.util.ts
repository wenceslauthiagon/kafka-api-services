import { isString } from 'class-validator';

/**
 * Add plus sign at beginning of phone
 * @param value The phone
 * @returns The phone with plus sign
 */
export const formatPhone = (value: string): string => {
  if (isString(value)) {
    return `+${value.replace(/[^0-9]/g, '')}`; // Remove non digits
  }
  return value;
};
