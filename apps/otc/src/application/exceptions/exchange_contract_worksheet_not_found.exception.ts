import { DefaultException, Exception, ExceptionTypes } from '@zro/common';

@Exception(ExceptionTypes.USER, 'EXCHANGE_CONTRACT_WORKSHEET_NOT_FOUND')
export class ExchangeContractWorksheetNotFoundException extends DefaultException {
  constructor(error: string) {
    super({
      type: ExceptionTypes.USER,
      code: 'EXCHANGE_CONTRACT_WORKSHEET_NOT_FOUND',
      data: error,
    });
  }
}
