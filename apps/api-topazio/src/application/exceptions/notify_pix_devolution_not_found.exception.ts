import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'NOTIFY_PIX_DEVOLUTION_NOT_FOUND')
export class NotifyPixDevolutionNotFoundException extends DefaultException {
  constructor(id: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'NOTIFY_PIX_DEVOLUTION_NOT_FOUND',
      data: { id },
    });
  }
}
