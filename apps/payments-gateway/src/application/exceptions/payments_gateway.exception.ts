import {
  Exception,
  ExceptionTypes,
  GatewayException,
  IException,
} from '@zro/common';

@Exception(ExceptionTypes.SYSTEM, 'PAYMENTS_GATEWAY_ERROR')
export class PaymentsGatewayException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'PAYMENTS_GATEWAY_ERROR',
      data: error?.data ?? error,
    });
  }
}
