import { DefaultException, Exception, ExceptionTypes } from '@zro/common';
import { GetExchangeContractFilter } from '@zro/otc/domain';

@Exception(ExceptionTypes.USER, 'EXCHANGE_CONTRACTS_NOT_FOUND_BY_FILTER')
export class ExchangeContractsNotFoundByFilterException extends DefaultException {
  constructor(filter: GetExchangeContractFilter) {
    super({
      type: ExceptionTypes.USER,
      code: 'EXCHANGE_CONTRACTS_NOT_FOUND_BY_FILTER',
      data: filter,
    });
  }
}
