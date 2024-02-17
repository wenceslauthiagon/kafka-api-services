import { Logger } from 'winston';
import {
  OperationRepository,
  UserLimitTrackerRepository,
} from '@zro/operations/domain';
import { SyncUpdateUserLimitTrackerByIntervalUseCase as UseCase } from '@zro/operations/application';

export class SyncUpdateUserLimitTrackerByIntervalController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    userLimitTrackerRepository: UserLimitTrackerRepository,
    operationRepository: OperationRepository,
  ) {
    this.logger = logger.child({
      context: SyncUpdateUserLimitTrackerByIntervalController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      userLimitTrackerRepository,
      operationRepository,
    );
  }

  async execute(): Promise<void> {
    this.logger.debug('Sync update user limit trackers by interval.');

    await this.usecase.execute();
  }
}
