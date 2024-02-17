import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixDevolution } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'PIX_DEVOLUTION_INVALID_STATE')
export class PixDevolutionInvalidStateException extends DefaultException {
  constructor(data: Partial<PixDevolution>) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEVOLUTION_INVALID_STATE',
      data,
    });
  }
}
