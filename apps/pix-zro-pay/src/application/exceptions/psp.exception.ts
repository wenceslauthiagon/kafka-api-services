import { GatewayException, ExceptionTypes, IException } from '@zro/common';

export class PixPaymentPspException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'PSP_ERROR',
      data: error?.data ?? error,
    });
  }
}

export class PixKeyNotFoundPspException extends PixPaymentPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.USER,
      code: 'PIX_KEY_NOT_FOUND_PSP',
      data: error,
    });
  }
}
