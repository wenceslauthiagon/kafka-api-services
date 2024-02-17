import { DatabaseRepository } from '@zro/common';
import {
  OperationsIndex,
  OperationsIndexRepository,
} from '@zro/operations/domain';
import { OperationsIndexModel } from '@zro/operations/infrastructure';
import { Op } from 'sequelize';

export class OperationsIndexDatabaseRepository
  extends DatabaseRepository
  implements OperationsIndexRepository
{
  /**
   * Convert OperationsIndex model to OperationsIndex domain.
   * @param operationsIndex Model instance.
   * @returns Domain instance.
   */
  static toDomain(operationsIndex: OperationsIndexModel): OperationsIndex {
    return operationsIndex?.toDomain() ?? null;
  }

  /**
   * Get index by name.
   *
   * @param name Index name.
   * @returns Index.
   */
  async getByName(name: string): Promise<OperationsIndex> {
    return OperationsIndexModel.findOne({
      where: { indexname: name },
      transaction: this.transaction,
    }).then(OperationsIndexDatabaseRepository.toDomain);
  }

  /**
   * Get indexes by table.
   *
   * @param tableName Table name.
   * @returns All indexes of searched table.
   */
  async getAllByTable(tableName: string): Promise<OperationsIndex[]> {
    return OperationsIndexModel.findAll({
      where: { tablename: tableName },
      transaction: this.transaction,
    }).then((data) => data.map(OperationsIndexDatabaseRepository.toDomain));
  }

  /**
   * Create partial index by date range of createdAt.
   *
   * @param table Table name.
   * @param indexName Index name.
   * @param initialDate Initial date.
   * @param lastDate Last date.
   */
  async createPartialIndexByDateRangeOfCreatedAt(
    table: string,
    indexName: string,
    initialDate: Date,
    lastDate: Date,
  ): Promise<void> {
    const queryInterface = OperationsIndexModel.sequelize.getQueryInterface();

    await queryInterface.addIndex(table, ['created_at'], {
      where: {
        created_at: {
          [Op.between]: [initialDate, lastDate],
        },
      },
      name: indexName,
    });
  }

  /**
   * Delete index.
   *
   * @param table Table name.
   * @param indexName Index name.
   */
  async dropIndex(table: string, indexName: string): Promise<void> {
    const queryInterface = OperationsIndexModel.sequelize.getQueryInterface();

    await queryInterface.removeIndex(table, indexName);
  }
}
