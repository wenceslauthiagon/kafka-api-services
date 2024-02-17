import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'INVALID_DOCUMENT_FORMAT')
export class InvalidDocumentFormatException extends DefaultException {
  constructor(value: string) {
    super({
      message: 'Invalid document format',
      type: ExceptionTypes.USER,
      code: 'INVALID_DOCUMENT_FORMAT',
      data: { value },
    });
  }
}
