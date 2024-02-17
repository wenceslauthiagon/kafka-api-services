import { registerDecorator, ValidationOptions } from 'class-validator';
import { isCron } from '../utils/is_cron.util';

export function IsCron(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsCron',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return value && isCron(value);
        },
      },
    });
  };
}
