import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { Currency } from '@zro/operations/domain';
import {
  StreamQuotation,
  StreamQuotationRepository,
} from '@zro/quotations/domain';

export class GetStreamQuotationByBaseAndQuoteAndGatewayNameUseCase {
  constructor(
    private logger: Logger,
    private streamQuotationRepository: StreamQuotationRepository,
  ) {
    this.logger = logger.child({
      context: GetStreamQuotationByBaseAndQuoteAndGatewayNameUseCase.name,
    });
  }

  async execute(
    baseCurrency: Currency,
    quoteCurrency: Currency,
    gatewayName: string,
  ): Promise<StreamQuotation> {
    this.logger.debug('Get stream quotation', {
      baseCurrency,
      quoteCurrency,
      gatewayName,
    });

    // Sanity check!
    if (!baseCurrency?.symbol || !quoteCurrency?.symbol || !gatewayName) {
      throw new MissingDataException([
        ...(!baseCurrency?.symbol ? ['Base Currency'] : []),
        ...(!quoteCurrency?.symbol ? ['Quote Currency'] : []),
        ...(!gatewayName ? ['Gateway Name'] : []),
      ]);
    }

    // Return any quotations found in repository. No safe boilerplate is requested!
    return this.streamQuotationRepository.getByBaseCurrencyAndQuoteCurrencyAndName(
      baseCurrency,
      quoteCurrency,
      gatewayName,
    );
  }
}
