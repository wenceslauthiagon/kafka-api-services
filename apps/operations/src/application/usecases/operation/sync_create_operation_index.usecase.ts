import { Logger } from 'winston';
import { OperationsIndexRepository } from '@zro/operations/domain';
import { getMoment } from '@zro/common';

export class SyncCreateOperationIndexUseCase {
  /**
   * Default constructor.
   * @param logger Logger service.
   * @param operationIndexRepository Operation Index repository.
   * @param tableName Table Name.
   */
  constructor(
    private readonly logger: Logger,
    private readonly operationIndexRepository: OperationsIndexRepository,
    private readonly tableName: string,
  ) {
    this.logger = logger.child({
      context: SyncCreateOperationIndexUseCase.name,
    });
  }

  /**
   * Create a partial index by date range.
   */
  async execute(): Promise<void> {
    for (let i = 0; i <= 1; i++) {
      const date = getMoment().add(i, 'month');
      const year = date.year();
      const month = date.month();

      const initialDate = date.startOf('month').toDate();
      const lastDate = date.endOf('month').toDate();

      const indexName = `Operations_created_at_index_${year}_${month + 1}`;

      const foundIndex =
        await this.operationIndexRepository.getByName(indexName);

      this.logger.debug('Operation index found.', {
        operationIndex: foundIndex,
      });

      if (!foundIndex) {
        await this.operationIndexRepository.createPartialIndexByDateRangeOfCreatedAt(
          this.tableName,
          indexName,
          initialDate,
          lastDate,
        );

        this.logger.debug('Operation index created.');
      }
    }
  }
}
