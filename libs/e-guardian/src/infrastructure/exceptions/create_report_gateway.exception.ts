import { GatewayException, ExceptionTypes, IException } from '@zro/common';

export class CreateReportGatewayException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'CREATE_REPORT_GATEWAY_ERROR',
      data: error,
    });
  }
}
