import { Logger } from 'winston';
import { OperationsIndexRepository } from '@zro/operations/domain';
import { SyncDeleteOperationIndexUseCase as UseCase } from '@zro/operations/application';

export class SyncDeleteOperationIndexController {
  private usecase: UseCase;

  constructor(
    private logger: Logger,
    operationsIndexRepository: OperationsIndexRepository,
    tableName: string,
  ) {
    this.logger = logger.child({
      context: SyncDeleteOperationIndexController.name,
    });

    this.usecase = new UseCase(
      this.logger,
      operationsIndexRepository,
      tableName,
    );
  }

  /**
   * Sync delete operation index.
   */
  async execute(): Promise<void> {
    this.logger.debug('Sync delete operation index request.');

    await this.usecase.execute();
  }
}
