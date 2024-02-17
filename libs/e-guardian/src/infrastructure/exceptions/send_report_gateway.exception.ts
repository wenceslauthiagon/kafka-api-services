import { GatewayException, ExceptionTypes, IException } from '@zro/common';

export class SendReportGatewayException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'SEND_REPORT_GATEWAY_ERROR',
      data: error,
    });
  }
}
