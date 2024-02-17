import { MaxLength as OriginalMaxLength } from 'class-validator';

export const MaxLength = (value: number) =>
  OriginalMaxLength(value, { message: '$constraint1' });
