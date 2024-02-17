import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixDevolutionReceived } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_DEVOLUTION_RECEIVED_INVALID_STATE')
export class PixDevolutionReceivedInvalidStateException extends DefaultException {
  constructor(data: Partial<PixDevolutionReceived>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEVOLUTION_RECEIVED_INVALID_STATE',
      data,
    });
  }
}
