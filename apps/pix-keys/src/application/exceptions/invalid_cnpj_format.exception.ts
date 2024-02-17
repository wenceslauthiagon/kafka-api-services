import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'INVALID_CNPJ_FORMAT')
export class InvalidCnpjFormatException extends DefaultException {
  constructor(value: string) {
    super({
      message: 'Invalid cnpj format',
      type: ExceptionTypes.USER,
      code: 'INVALID_CNPJ_FORMAT',
      data: { value },
    });
  }
}
