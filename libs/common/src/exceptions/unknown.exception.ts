import { ExceptionTypes } from '../helpers/error.constants';
import { DefaultException } from '../helpers/error.helper';

export class UnknownException extends DefaultException {
  constructor(error: Error) {
    super({
      message: 'Unexpected error',
      type: ExceptionTypes.UNKNOWN,
      code: 'UNKNOWN',
      data: error,
    });
  }
}
