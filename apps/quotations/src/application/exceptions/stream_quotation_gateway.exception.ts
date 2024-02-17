import { GatewayException, ExceptionTypes, IException } from '@zro/common';
import { Provider } from '@zro/otc/domain';

export class StreamQuotationGatewayException extends GatewayException {
  constructor(error?: IException) {
    super({
      type: error?.type ?? ExceptionTypes.SYSTEM,
      code: error?.code ?? 'STREAM_QUOTATION_GATEWAY_ERROR',
      data: error?.data ?? error,
    });
  }
}

export class OfflineStreamQuotationGatewayException extends StreamQuotationGatewayException {
  constructor(error: Error, provider: Provider) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'STREAM_QUOTATION_GATEWAY_OFFLINE',
      data: { error, provider },
    });
  }
}

export class UnexpectedStreamQuotationGatewayException extends StreamQuotationGatewayException {
  constructor(data: any) {
    super({
      type: ExceptionTypes.SYSTEM,
      code: 'STREAM_UNEXPECTED_QUOTATION_GATEWAY_OFFLINE',
      data,
    });
  }
}
