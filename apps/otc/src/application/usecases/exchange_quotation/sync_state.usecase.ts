import { Logger } from 'winston';
import {
  ExchangeQuotation,
  ExchangeQuotationRepository,
  ExchangeQuotationState,
  RemittanceExchangeQuotationRepository,
  RemittanceRepository,
  RemittanceStatus,
} from '@zro/otc/domain';
import {
  ExchangeQuotationGateway,
  RemittanceEventEmitter,
  GetExchangeQuotationByPspIdRequest,
  ExchangeQuotationNotFoundPspException,
  ExchangeQuotationEventEmitter,
} from '@zro/otc/application';

export class SyncStateExchangeQuotationUseCase {
  private logger: Logger;
  constructor(
    logger: Logger,
    private readonly pspGateway: ExchangeQuotationGateway,
    private readonly exchangeQuotationRepository: ExchangeQuotationRepository,
    private readonly remittanceRepository: RemittanceRepository,
    private readonly remittanceExchangeQuotationRepository: RemittanceExchangeQuotationRepository,
    private readonly remittanceEmitter: RemittanceEventEmitter,
    private readonly exchangeQuotationEmitter: ExchangeQuotationEventEmitter,
  ) {
    this.logger = logger.child({
      context: SyncStateExchangeQuotationUseCase.name,
    });
  }

  async execute(): Promise<void> {
    // Check all accepted and approved exchange quotations states
    const exchangeQuotations =
      await this.exchangeQuotationRepository.getAllByStateIn([
        ExchangeQuotationState.ACCEPTED,
        ExchangeQuotationState.APPROVED,
      ]);

    this.logger.debug('Exchange quotation found.', {
      exchangeQuotationsLength: exchangeQuotations.length,
    });

    for (const exchangeQuotation of exchangeQuotations) {
      // Search in PSP for sync state
      const payload: GetExchangeQuotationByPspIdRequest = {
        solicitationPspId: exchangeQuotation.solicitationPspId,
      };

      this.logger.debug('Send get exchange quotation for exchange quotation.', {
        solicitationPspId: exchangeQuotation.solicitationPspId,
      });

      try {
        const pspResult =
          await this.pspGateway.getExchangeQuotationById(payload);

        this.logger.debug('Psp result exchange quotation.', {
          exchangeQuotation: pspResult,
        });

        if (!pspResult) throw new ExchangeQuotationNotFoundPspException();

        switch (pspResult.status) {
          case ExchangeQuotationState.APPROVED:
            exchangeQuotation.state = ExchangeQuotationState.APPROVED;
            this.exchangeQuotationEmitter.approvedExchangeQuotation(
              exchangeQuotation,
            );
            break;
          case ExchangeQuotationState.COMPLETED:
            exchangeQuotation.state = ExchangeQuotationState.COMPLETED;
            await this.closeAllRemittances(exchangeQuotation);
            this.exchangeQuotationEmitter.completedExchangeQuotation(
              exchangeQuotation,
            );
            break;
          case ExchangeQuotationState.CANCELED:
            exchangeQuotation.state = ExchangeQuotationState.CANCELED;
            await this.reopenAllRemittances(exchangeQuotation);
            this.exchangeQuotationEmitter.canceledExchangeQuotation(
              exchangeQuotation,
            );
            break;
          default:
            this.logger.debug('Psp result state not found.', {
              exchangeQuotation: pspResult,
            });
        }
      } catch (error) {
        if (error instanceof ExchangeQuotationNotFoundPspException) {
          exchangeQuotation.state = ExchangeQuotationState.REJECTED;
          await this.reopenAllRemittances(exchangeQuotation);
        }
      }

      // Update Exchange Quotation
      await this.exchangeQuotationRepository.update(exchangeQuotation);
    }
  }

  private async closeAllRemittances(exchangeQuotation: ExchangeQuotation) {
    const remittanceExchangeQuotationFound =
      await this.remittanceExchangeQuotationRepository.getAllByExchangeQuotation(
        exchangeQuotation,
      );

    this.logger.debug('Remittance Exchange Quotation found.', {
      remittanceExchangeQuotation: remittanceExchangeQuotationFound,
    });

    for (const remittanceExchangeQuotation of remittanceExchangeQuotationFound) {
      const remittanceFound = await this.remittanceRepository.getById(
        remittanceExchangeQuotation.remittance.id,
      );

      remittanceFound.status = RemittanceStatus.CLOSED;
      remittanceFound.bankQuote = exchangeQuotation.quotation;
      remittanceFound.resultAmount = exchangeQuotation.amountExternalCurrency;
      await this.remittanceRepository.update(remittanceFound);
      this.remittanceEmitter.closedRemittance({
        ...remittanceFound,
        systemId: remittanceFound.system?.id,
      });
    }
  }

  private async reopenAllRemittances(exchangeQuotation: ExchangeQuotation) {
    const remittanceExchangeQuotationFound =
      await this.remittanceExchangeQuotationRepository.getAllByExchangeQuotation(
        exchangeQuotation,
      );

    this.logger.debug('Remittance Exchange Quotation found.', {
      remittanceExchangeQuotation: remittanceExchangeQuotationFound,
    });

    for (const remittanceExchangeQuotation of remittanceExchangeQuotationFound) {
      const remittanceFound = await this.remittanceRepository.getById(
        remittanceExchangeQuotation.remittance.id,
      );

      remittanceFound.status = RemittanceStatus.OPEN;
      await this.remittanceRepository.update(remittanceFound);
    }
  }
}
