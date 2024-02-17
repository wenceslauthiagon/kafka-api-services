import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'INVALID_CPF_FORMAT')
export class InvalidCpfFormatException extends DefaultException {
  constructor(value: string) {
    super({
      message: 'Invalid cpf format',
      type: ExceptionTypes.USER,
      code: 'INVALID_CPF_FORMAT',
      data: { value },
    });
  }
}
