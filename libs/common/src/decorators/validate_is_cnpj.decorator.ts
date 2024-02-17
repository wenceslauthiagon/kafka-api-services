import { registerDecorator, ValidationOptions } from 'class-validator';
import { isCnpj } from '../utils/is_cnpj.util';

export function IsCnpj(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsCnpj',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value && isCnpj(value);
        },
      },
    });
  };
}
