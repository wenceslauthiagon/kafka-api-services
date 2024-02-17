import { ExceptionTypes } from '../helpers/error.constants';
import { DefaultException } from '../helpers/error.helper';

export class NotImplementedException extends DefaultException {
  constructor(detail?: string) {
    super({
      message: 'Not implemented',
      type: ExceptionTypes.SYSTEM,
      code: 'NOT_IMPLEMENTED',
      data: detail,
    });
  }
}
