import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'PIX_DEVOLUTION_RECEIVED_NOT_FOUND')
export class PixDevolutionReceivedNotFoundException extends DefaultException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEVOLUTION_RECEIVED_NOT_FOUND',
      data,
    });
  }
}
