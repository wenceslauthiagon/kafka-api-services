import { validateSync, ValidationError } from 'class-validator';
import { InvalidDataFormatException } from '../exceptions';

export const validate = (value: any): void => {
  const errors = validateSync(value, {
    forbidNonWhitelisted: true,
    whitelist: true,
  });

  if (errors.length) {
    throw new InvalidDataFormatException(
      errors.map((err: ValidationError) => JSON.stringify(err.constraints)),
    );
  }
};

export abstract class AutoValidator {
  constructor(props: any) {
    Object.assign(this, props);
    validate(this);
  }

  /**
   * WARNING: DO NOT OVERRIDE THIS METHOD
   *
   * All classes objects that go through client kafka must have toString method.
   * @returns JSON string.
   */
  toString(): string {
    return JSON.stringify(this);
  }
}
