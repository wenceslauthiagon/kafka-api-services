import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'DOCK_AUTH')
export class DockAuthException extends DefaultException {
  constructor(error?: Error) {
    super({
      message: 'Dock Auth error',
      type: ExceptionTypes.SYSTEM,
      code: 'DOCK_AUTH',
      data: error,
    });
  }
}
