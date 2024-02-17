import { registerDecorator, ValidationOptions } from 'class-validator';
import { isMobilePhone } from '../utils/is_mobile_phone.util';
import { isEmail } from '../utils/is_email.util';
import { isCpf } from '../utils/is_cpf.util';
import { isCnpj } from '../utils/is_cnpj.util';

export function IsMobilePhoneOrEmailOrDocument(
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsMobilePhoneOrEmailOrCpf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            value &&
            (isMobilePhone(value) ||
              isEmail(value) ||
              isCpf(value) ||
              isCnpj(value))
          );
        },
      },
    });
  };
}
