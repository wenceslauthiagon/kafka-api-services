import { registerDecorator, ValidationOptions } from 'class-validator';
import { isCpf } from '../utils/is_cpf.util';

export function IsCpf(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsCpf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value && isCpf(value);
        },
      },
    });
  };
}
