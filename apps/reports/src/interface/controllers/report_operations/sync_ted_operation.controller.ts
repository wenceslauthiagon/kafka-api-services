import { Logger } from 'winston';
import {
  BankingService,
  OperationService,
  SyncTedOperationUseCase as UseCase,
} from '@zro/reports/application';
import { ReportOperationRepository } from '@zro/reports/domain';

export class SyncTedOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    reportOperationRepository: ReportOperationRepository,
    operationService: OperationService,
    bankingService: BankingService,
    tedOperationTags: string,
    zrobankIspb: string,
    currencyTag: string,
    tedReceiveTag: string,
    tedSentTag: string,
  ) {
    this.logger = logger.child({
      context: SyncTedOperationController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      reportOperationRepository,
      operationService,
      bankingService,
      tedOperationTags,
      zrobankIspb,
      currencyTag,
      tedReceiveTag,
      tedSentTag,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync ted operation request.');
    await this.usecase.execute();
  }
}
