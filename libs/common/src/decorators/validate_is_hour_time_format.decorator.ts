import { registerDecorator, ValidationOptions } from 'class-validator';
import { validateHourTimeFormat } from '../utils';

export function IsHourTimeFormat(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsHourTimeFormat',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return validateHourTimeFormat(value);
        },
      },
    });
  };
}
