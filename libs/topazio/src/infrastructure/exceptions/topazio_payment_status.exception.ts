import {
  ExceptionTypes,
  DefaultException,
  Exception,
} from '@zro/common/helpers';

@Exception(ExceptionTypes.SYSTEM, 'TOPAZIO_PAYMENT_STATUS')
export class TopazioPaymentStatusException extends DefaultException {
  constructor(data?: string) {
    super({
      message: 'Topazio Payment Status error',
      type: ExceptionTypes.SYSTEM,
      code: 'TOPAZIO_PAYMENT_STATUS',
      data,
    });
  }
}
