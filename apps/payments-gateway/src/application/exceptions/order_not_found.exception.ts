import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { PaymentsGatewayError } from '@zro/payments-gateway/application';

@Exception(ExceptionTypes.USER, 'ORDER_NOT_FOUND')
export class OrderNotFoundException extends DefaultException {
  constructor(data: PaymentsGatewayError) {
    super({
      type: ExceptionTypes.USER,
      code: 'ORDER_NOT_FOUND',
      data,
    });
  }
}
