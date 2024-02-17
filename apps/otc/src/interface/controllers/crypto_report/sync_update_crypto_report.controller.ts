import { Logger } from 'winston';
import {
  CryptoReportCurrentPageRepository,
  CryptoReportRepository,
} from '@zro/otc/domain';
import {
  HistoricalCryptoPriceGateway,
  OperationService,
  QuotationService,
  SyncUpdateCryptoReportUseCase as UseCase,
} from '@zro/otc/application';

export class SyncUpdateCryptoReportController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    cryptoReportRepository: CryptoReportRepository,
    cryptoReportCurrentPageRepository: CryptoReportCurrentPageRepository,
    historicalCryptoPriceGateway: HistoricalCryptoPriceGateway,
    operationService: OperationService,
    quotationService: QuotationService,
    pageSize: number,
  ) {
    this.logger = logger.child({
      context: SyncUpdateCryptoReportController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      cryptoReportRepository,
      cryptoReportCurrentPageRepository,
      historicalCryptoPriceGateway,
      operationService,
      quotationService,
      pageSize,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Started updating crypto report request.');

    await this.usecase.execute();

    this.logger.debug('Finished updating crypto report request.');
  }
}
