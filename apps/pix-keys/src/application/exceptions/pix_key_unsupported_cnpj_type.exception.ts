import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'PIX_KEY_UNSUPPORTED_CNPJ_TYPE')
export class PixKeyUnsupportedCnpjTypeException extends DefaultException {
  constructor(invalidList: string[]) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_KEY_UNSUPPORTED_CNPJ_TYPE',
      data: invalidList?.filter((x) => x),
    });
  }
}
