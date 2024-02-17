import { isNumber, isString } from 'class-validator';

export const formatBranch = (value: string | number): string => {
  if (isNumber(value)) {
    value = value.toString();
  }

  if (isString(value)) {
    return value.replace(/[^0-9]/g, '').padStart(4, '0'); // Remove non digits
  }
  return value;
};
