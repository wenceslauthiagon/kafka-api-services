import { Domain } from '@zro/common';

export interface OperationsIndex extends Domain<number> {
  /**
   * Schema title. Example: 'public'
   */
  schemaName: string;

  /**
   * Table name. Example: 'Operations'
   */
  tableName: string;

  /**
   * Index name. Example: 'operations_index'
   */
  indexName: string;

  /**
   * Index definition. Example: 'CREATE INDEX ... USING btree(id)'
   */
  indexDef: string;
}

export class OperationsIndexEntity implements OperationsIndex {
  schemaName: string;
  tableName: string;
  indexName: string;
  indexDef: string;

  constructor(props: Partial<OperationsIndexEntity>) {
    Object.assign(this, props);
  }
}
