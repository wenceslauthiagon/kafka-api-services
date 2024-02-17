import { GatewayException, ExceptionTypes, IException } from '@zro/common';

export class CompliancePspException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'PSP_ERROR',
      data: error?.data ?? error,
    });
  }
}

export class InvalidUpdateWarningTransactionStatusToClosedCompliancePspException extends CompliancePspException {
  constructor(data: string) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'INVALID_UPDATE_WARNING_TRANSACTION_STATUS_PSP',
      data,
    });
  }
}

export class OfflineCompliancePspException extends CompliancePspException {
  constructor(error: Error) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'PSP_OFFLINE',
      data: error,
    });
  }
}
