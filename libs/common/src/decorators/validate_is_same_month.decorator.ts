import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';
import { getMoment } from '@zro/common';

export function IsSameMonth(
  property: string,
  optional: boolean,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsSameMonth',
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
            getMoment(value).isSame(getMoment(relatedValue), 'month')
          );
        },
      },
    });
  };
}
