import { registerDecorator, ValidationOptions } from 'class-validator';
import { isCpf } from '../utils/is_cpf.util';
import { isCnpj } from '../utils/is_cnpj.util';

export function IsCpfOrCnpj(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsCpfOrCnpj',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value && (isCpf(value) || isCnpj(value));
        },
      },
    });
  };
}
