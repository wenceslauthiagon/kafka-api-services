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

export class InvalidUpdateInfractionStatusPixPaymentPspException extends PixPaymentPspException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'INVALID_UPDATE_INFRACTION_STATUS_PSP',
      data,
    });
  }
}

export class OfflinePixPaymentPspException extends PixPaymentPspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'PSP_OFFLINE',
      data: error,
    });
  }
}

export class InvalidUpdateWarningTransactionPixPaymentPspException extends PixPaymentPspException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'INVALID_UPDATE_WARNING_TRANSACTION_PSP',
      data,
    });
  }
}

export class InvalidGetRefundNotFoundPixPaymentPspException extends PixPaymentPspException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'INVALID_GET_REFUND_NOT_FOUND_PSP',
      data,
    });
  }
}

export class DecodeQrCodeTimeoutPixPaymentPspException extends PixPaymentPspException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'DECODE_QR_CODE_TIMEOUT_PSP',
      data,
    });
  }
}
