import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PixDevolution } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'INVALID_PIX_DEVOLUTION')
export class InvalidPixDevolutionException extends DefaultException {
  constructor(data: Partial<PixDevolution>) {
    super({
      type: ExceptionTypes.USER,
      code: 'INVALID_PIX_DEVOLUTION',
      data,
    });
  }
}
