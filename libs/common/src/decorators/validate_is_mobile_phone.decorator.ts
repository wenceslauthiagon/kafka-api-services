import { registerDecorator, ValidationOptions } from 'class-validator';
import { isMobilePhone } from '../utils/is_mobile_phone.util';

export function IsMobilePhone(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsMobilePhone',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value && isMobilePhone(value);
        },
      },
    });
  };
}
