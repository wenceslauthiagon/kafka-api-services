import { MinLength as OriginalMinLength } from 'class-validator';

export const MinLength = (value: number) =>
  OriginalMinLength(value, { message: '$constraint1' });
