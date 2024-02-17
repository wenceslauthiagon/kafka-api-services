import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { WarningPixDevolution } from '@zro/pix-payments/domain';

@Exception(ExceptionTypes.USER, 'WARNING_PIX_DEVOLUTION_INVALID_STATE')
export class WarningPixDevolutionInvalidStateException extends DefaultException {
  constructor(data: Partial<WarningPixDevolution>) {
    super({
      type: ExceptionTypes.USER,
      code: 'WARNING_PIX_DEVOLUTION_INVALID_STATE',
      data,
    });
  }
}
