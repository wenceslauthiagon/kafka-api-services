import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsSort(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsSort',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          return (
            (Array.isArray(value) &&
              value.every((it) => typeof it === 'string')) ||
            typeof value === 'string'
          );
        },
      },
    });
  };
}
