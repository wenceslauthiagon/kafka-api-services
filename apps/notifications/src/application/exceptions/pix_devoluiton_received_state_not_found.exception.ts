import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { PixDevolutionReceived } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_DEVOLUTION_RECEIVED_STATE_NOT_FOUND')
export class PixDevolutionReceivedStateNotFoundException extends DefaultException {
  constructor(data: Partial<PixDevolutionReceived>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEVOLUTION_RECEIVED_STATE_NOT_FOUND',
      data,
    });
  }
}
