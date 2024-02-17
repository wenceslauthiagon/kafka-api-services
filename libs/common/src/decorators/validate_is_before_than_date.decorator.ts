import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { getMoment } from '@zro/common';

export function IsDateBeforeThan(
  property: string,
  optional: boolean,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsDateBeforeThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = args.object[relatedPropertyName];

          if (optional && !relatedValue) {
            return true;
          }

          return (
            value &&
            relatedValue &&
            getMoment(value).isSameOrBefore(getMoment(relatedValue))
          );
        },
      },
    });
  };
}
