import { ExceptionTypes } from '../helpers/error.constants';
import { DefaultException } from '../helpers/error.helper';

export class DatabaseException extends DefaultException {
  constructor(error: Error) {
    super({
      message: 'Database error',
      type: ExceptionTypes.USER,
      code: 'DATABASE',
      data: error,
    });
  }
}
