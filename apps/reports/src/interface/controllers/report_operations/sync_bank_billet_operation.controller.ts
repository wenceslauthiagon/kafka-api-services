import { Logger } from 'winston';
import {
  OperationService,
  SyncBankBilletOperationUseCase as UseCase,
} from '@zro/reports/application';
import { ReportOperationRepository } from '@zro/reports/domain';

export class SyncBankBilletOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    reportOperationRepository: ReportOperationRepository,
    operationService: OperationService,
    bankBilletOperationTags: string,
    zrobankIspb: string,
    currencyTag: string,
  ) {
    this.logger = logger.child({
      context: SyncBankBilletOperationController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      reportOperationRepository,
      operationService,
      bankBilletOperationTags,
      zrobankIspb,
      currencyTag,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync bank billet operation request.');
    await this.usecase.execute();
  }
}
