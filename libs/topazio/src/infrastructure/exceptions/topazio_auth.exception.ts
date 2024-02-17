import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'TOPAZIO_AUTH')
export class TopazioAuthException extends DefaultException {
  constructor(error?: Error) {
    super({
      message: 'Topazio Auth error',
      type: ExceptionTypes.SYSTEM,
      code: 'TOPAZIO_AUTH',
      data: error,
    });
  }
}
