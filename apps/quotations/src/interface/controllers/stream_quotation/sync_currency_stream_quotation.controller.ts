import { Logger } from 'winston';
import {
  QuotationTrendRepository,
  StreamQuotationRepository,
} from '@zro/quotations/domain';
import { CurrencyEntity } from '@zro/operations/domain';
import {
  SyncCurrencyStreamQuotationUseCase,
  OperationService,
} from '@zro/quotations/application';

export class SyncCurrencyStreamQuotationController {
  private usecase: SyncCurrencyStreamQuotationUseCase;

  constructor(
    private logger: Logger,
    streamQuotationRepository: StreamQuotationRepository,
    quotationTrendRepository: QuotationTrendRepository,
    operationService: OperationService,
    private readonly operationCurrencySymbol: string,
  ) {
    this.logger = logger.child({
      context: SyncCurrencyStreamQuotationController.name,
    });

    this.usecase = new SyncCurrencyStreamQuotationUseCase(
      this.logger,
      streamQuotationRepository,
      quotationTrendRepository,
      operationService,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Syncing currency stream quotations request.');

    const quoteCurrency = new CurrencyEntity({
      symbol: this.operationCurrencySymbol,
    });

    await this.usecase.execute(quoteCurrency);
  }
}
