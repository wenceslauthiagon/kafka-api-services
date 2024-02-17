import { ExceptionTypes } from '../helpers/error.constants';
import { DefaultException } from '../helpers/error.helper';

export class NullPointerException extends DefaultException {
  constructor(detail?: string) {
    super({
      message: 'Null pointer',
      type: ExceptionTypes.SYSTEM,
      code: 'NULL_POINTER',
      data: detail,
    });
  }
}
