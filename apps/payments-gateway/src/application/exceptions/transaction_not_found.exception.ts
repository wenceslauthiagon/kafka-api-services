import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

export type PaymentsGatewayError = {
  code: string;
  message: string;
};

@Exception(ExceptionTypes.USER, 'TRANSACTION_NOT_FOUND')
export class TransactionNotFoundException extends DefaultException {
  constructor(data: PaymentsGatewayError) {
    super({
      type: ExceptionTypes.USER,
      code: 'TRANSACTION_NOT_FOUND',
      data,
    });
  }
}
