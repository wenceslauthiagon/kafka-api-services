import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { ExchangeContract } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'EXCHANGE_CONTRACT_NOT_FOUND')
export class ExchangeContractNotFoundException extends DefaultException {
  constructor(exchangeContract: Partial<ExchangeContract>) {
    super({
      type: ExceptionTypes.USER,
      code: 'EXCHANGE_CONTRACT_NOT_FOUND',
      data: exchangeContract,
    });
  }
}
