import { GatewayException, ExceptionTypes, IException } from '@zro/common';

export class WarningTransactionException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'PSP_ERROR',
      data: error?.data ?? error,
    });
  }
}

export class InvalidUpdateWarningTransactionException extends WarningTransactionException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'INVALID_UPDATE_WARNING_TRANSACTION_STATUS_PSP',
      data,
    });
  }
}

export class OfflineWarningTransactionException extends WarningTransactionException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'PSP_OFFLINE',
      data: error,
    });
  }
}
