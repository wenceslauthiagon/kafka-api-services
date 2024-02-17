import { Logger } from 'winston';
import {
  OperationService,
  SyncCardOperationUseCase as UseCase,
} from '@zro/reports/application';
import { ReportOperationRepository } from '@zro/reports/domain';

export class SyncCardOperationController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    reportOperationRepository: ReportOperationRepository,
    operationService: OperationService,
    cardOperationTags: string,
    zrobankIspb: string,
    currencyTag: string,
  ) {
    this.logger = logger.child({ context: SyncCardOperationController.name });

    this.usecase = new UseCase(
      this.logger,
      reportOperationRepository,
      operationService,
      cardOperationTags,
      zrobankIspb,
      currencyTag,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync card operation request.');
    await this.usecase.execute();
  }
}
