import { registerDecorator, ValidationOptions } from 'class-validator';

export function Sort(entity: object, validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'Sort',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          const sortKeys = Object.values(entity);
          if (Array.isArray(value)) {
            return value.filter((v) => !sortKeys.includes(v)).length === 0;
          }
          return value && sortKeys.includes(value);
        },
      },
    });
  };
}
