import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'GENIAL_AUTH')
export class GenialAuthException extends DefaultException {
  constructor(error?: Error) {
    super({
      message: 'Genial Auth error',
      type: ExceptionTypes.SYSTEM,
      code: 'GENIAL_AUTH',
      data: error,
    });
  }
}
