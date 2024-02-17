import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsSmallerThan(
  property: string,
  optional: boolean,
  validationOptions?: ValidationOptions,
) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      name: 'IsSmallerThan',
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
            value >= 0 &&
            relatedValue >= 0 &&
            parseFloat(value) <= parseFloat(relatedValue)
          );
        },
      },
    });
  };
}
