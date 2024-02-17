import { Logger } from 'winston';
import { MissingDataException } from '@zro/common';
import { RemittanceNotFoundException } from '@zro/otc/application';
import {
  Remittance,
  RemittanceRepository,
  RemittanceStatus,
} from '@zro/otc/domain';
import { Currency } from '@zro/operations/domain';

export class HandleFailedCreateAndAcceptExchangeQuotationEventUseCase {
  private logger: Logger;
  constructor(
    logger: Logger,
    private readonly remittanceRepository: RemittanceRepository,
  ) {
    this.logger = logger.child({
      context: HandleFailedCreateAndAcceptExchangeQuotationEventUseCase.name,
    });
  }

  async execute(
    remittanceIds: Remittance['id'][],
    sendDate: Remittance['sendDate'],
    receiveDate: Remittance['receiveDate'],
    currencyTag: Currency['tag'],
  ): Promise<void> {
    if (!remittanceIds?.length || !sendDate || !receiveDate || !currencyTag) {
      throw new MissingDataException([
        ...(!remittanceIds?.length ? ['Remittance Ids'] : []),
        ...(!sendDate ? ['Send date'] : []),
        ...(!receiveDate ? ['Receive date'] : []),
        ...(!currencyTag ? ['Currency tag'] : []),
      ]);
    }

    // Reopen all remittances for reprocess.
    for (const remittanceId of remittanceIds) {
      const remittanceFound =
        await this.remittanceRepository.getById(remittanceId);

      this.logger.debug('Remittance found.', { remittance: remittanceFound });

      if (!remittanceFound) {
        throw new RemittanceNotFoundException({ id: remittanceId });
      }

      if (remittanceFound.status == RemittanceStatus.WAITING) {
        remittanceFound.status = RemittanceStatus.OPEN;

        await this.remittanceRepository.update(remittanceFound);

        this.logger.debug('Updated remittance status to open.', {
          remittance: remittanceFound,
        });
      }
    }
  }
}
