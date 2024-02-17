import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'ZROBANK_AUTH')
export class ZroBankAuthException extends DefaultException {
  constructor(error?: Error) {
    super({
      message: 'ZroBank Auth error',
      type: ExceptionTypes.SYSTEM,
      code: 'ZROBANK_AUTH',
      data: error,
    });
  }
}
