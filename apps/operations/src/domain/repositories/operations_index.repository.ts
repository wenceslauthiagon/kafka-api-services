import { OperationsIndex } from '@zro/operations/domain';

export interface OperationsIndexRepository {
  /**
   * Gel index by name.
   * @param name Index name.
   * @returns OperationsIndex.
   */
  getByName: (name: string) => Promise<OperationsIndex>;

  /**
   * Gel indexes by table.
   * @param tableName Table name.
   * @returns All indexes of searched table.
   */
  getAllByTable: (tableName: string) => Promise<OperationsIndex[]>;

  /**
   * Create partial index by date range of createdAt.
   *
   * @param table Table name.
   * @param indexName Index name.
   * @param initialDate Initial date.
   * @param lastDate Last date.
   */
  createPartialIndexByDateRangeOfCreatedAt: (
    table: string,
    indexName: string,
    initialDate: Date,
    lastDate: Date,
  ) => Promise<void>;

  /**
   * Delete index.
   *
   * @param table Table name.
   * @param indexName Index name.
   */
  dropIndex(table: string, indexName: string): Promise<void>;
}
