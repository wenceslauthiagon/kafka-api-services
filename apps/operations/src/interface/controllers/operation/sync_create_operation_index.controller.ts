import { Logger } from 'winston';
import { OperationsIndexRepository } from '@zro/operations/domain';
import { SyncCreateOperationIndexUseCase as UseCase } from '@zro/operations/application';

export class SyncCreateOperationIndexController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationsIndexRepository: OperationsIndexRepository,
    tableName: string,
  ) {
    this.logger = logger.child({
      context: SyncCreateOperationIndexController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      operationsIndexRepository,
      tableName,
    );
  }

  /**
   * Sync create operation index.
   */
  async execute(): Promise<void> {
    this.logger.debug('Sync create operation index request.');

    await this.usecase.execute();
  }
}
