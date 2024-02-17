import { Logger } from 'winston';
import {
  PixPaymentService,
  SyncPixStatementUseCase as UseCase,
} from '@zro/api-topazio/application';
import {
  FailedNotifyCreditRepository,
  PixStatementRepository,
} from '@zro/api-topazio/domain';
import { TranslateService } from '@zro/common';

export class SyncPixStatementController {
  private readonly usecase: UseCase;

  constructor(
    private logger: Logger,
    pixPaymentService: PixPaymentService,
    pixStatementRepository: PixStatementRepository,
    failedNotifyCreditRepository: FailedNotifyCreditRepository,
    private readonly apiTopazioZroBankIspb: string,
    translateService: TranslateService,
  ) {
    this.logger = logger.child({ context: SyncPixStatementController.name });

    this.usecase = new UseCase(
      this.logger,
      pixPaymentService,
      pixStatementRepository,
      failedNotifyCreditRepository,
      this.apiTopazioZroBankIspb,
      translateService,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync pix statements request.');

    await this.usecase.execute();

    this.logger.debug('Finish sync pix statements.');
  }
}
