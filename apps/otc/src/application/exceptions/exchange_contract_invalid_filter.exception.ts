import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'EXCHANGE_CONTRACT_INVALID_FILTER')
export class ExchangeContractInvalidFilterException extends DefaultException {
  constructor(message: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'EXCHANGE_CONTRACT_INVALID_FILTER',
      data: message,
    });
  }
}
