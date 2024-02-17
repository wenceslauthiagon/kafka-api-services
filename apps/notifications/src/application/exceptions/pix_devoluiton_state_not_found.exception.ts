import { DefaultException, ExceptionTypes, Exception } from '@zro/common';
import { PixDevolution } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_DEVOLUTION_STATE_NOT_FOUND')
export class PixDevolutionStateNotFoundException extends DefaultException {
  constructor(data: Partial<PixDevolution>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEVOLUTION_STATE_NOT_FOUND',
      data,
    });
  }
}
