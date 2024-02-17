import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

@ValidatorConstraint({ name: 'MaxValue', async: false })
export class MaxValueConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const maxValue = args.constraints[0];
    return value <= maxValue;
  }

  defaultMessage(args: ValidationArguments) {
    const maxValue = args.constraints[0];
    const cientificNotation = maxValue.toExponential();
    const result = cientificNotation.toString();
    return result;
  }
}

export function MaxValue(
  maxValue: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'MaxValue',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: MaxValueConstraint,
      constraints: [maxValue],
    });
  };
}
