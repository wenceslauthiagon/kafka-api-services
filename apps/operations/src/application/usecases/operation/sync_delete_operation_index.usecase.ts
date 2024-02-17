import { Logger } from 'winston';
import { OperationsIndexRepository } from '@zro/operations/domain';
import { getMoment } from '@zro/common';

export class SyncDeleteOperationIndexUseCase {
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
      context: SyncDeleteOperationIndexUseCase.name,
    });
  }

  /**
   * Delete a partial index.
   */
  async execute(): Promise<void> {
    const foundIndexes = await this.operationIndexRepository.getAllByTable(
      this.tableName,
    );

    this.logger.debug('Operation indexes found.', {
      operationIndexes: foundIndexes,
    });

    if (!foundIndexes?.length) return;

    const regex = new RegExp(/Operations_created_at_index_(\d{4})_(\d+)/);

    const dates = foundIndexes
      .filter((item) => item.indexName.match(regex) !== null)
      .map((item) => {
        const matches = item.indexName.match(regex);
        return {
          indexName: matches[0],
          year: Number(matches[1]),
          month: Number(matches[2]),
        };
      });

    if (!dates?.length) return;

    for (const date of dates) {
      const oldDate = getMoment({ year: date.year, month: date.month - 1 });
      const fiveYearsAgo = getMoment().startOf('month').subtract(5, 'year');

      if (oldDate.isBefore(fiveYearsAgo)) {
        await this.operationIndexRepository.dropIndex(
          this.tableName,
          date.indexName,
        );

        this.logger.debug('Operation index deleted', {
          operationIndex: date.indexName,
        });
      }
    }
  }
}
