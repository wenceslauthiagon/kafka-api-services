import { DefaultException, ExceptionTypes } from '@zro/common';
import { ValidationError } from 'class-validator';

export class ValidationException extends DefaultException {
  static code = 'VALIDATION';

  constructor(errors: ValidationError[]) {
    super({
      message: 'Invalid data',
      type: ExceptionTypes.USER,
      code: ValidationException.code,
      data: errors,
    });
  }
}
