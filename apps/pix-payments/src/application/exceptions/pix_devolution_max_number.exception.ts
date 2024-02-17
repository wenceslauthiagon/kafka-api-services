import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'PIX_DEVOLUTION_MAX_NUMBER')
export class PixDevolutionMaxNumberException extends DefaultException {
  constructor(quantity: number) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_DEVOLUTION_MAX_NUMBER',
      data: quantity,
    });
  }
}
