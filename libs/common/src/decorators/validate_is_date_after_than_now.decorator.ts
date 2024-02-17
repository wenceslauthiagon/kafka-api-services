import { registerDecorator, ValidationOptions } from 'class-validator';
import { getMoment } from '@zro/common';

export function IsDateAfterThanNow(
  format: string,
  optional: boolean,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsDateAfterThanNow',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (optional) {
            return true;
          }

          const now = getMoment().format(format);

          return value && getMoment(value).isSameOrAfter(getMoment(now));
        },
      },
    });
  };
}
