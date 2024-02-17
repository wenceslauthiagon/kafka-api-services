import {
  ExceptionTypes,
  DefaultException,
  GatewayException,
  Exception,
} from '@zro/common';

@Exception(ExceptionTypes.USER, 'TRANSACTION_EXPORTS_OFFLINE')
export class OfflineTransactionExportsException extends DefaultException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'TRANSACTION_EXPORTS_OFFLINE',
      data: error,
    });
  }
}

export class TransactionExportsException extends GatewayException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.USER,
      code: error?.message ?? 'TRANSACTION_EXPORTS_FAILED',
      data: error?.stack ?? null,
    });
  }
}
