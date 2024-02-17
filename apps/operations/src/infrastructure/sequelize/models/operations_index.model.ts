import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { DatabaseModel } from '@zro/common';
import { OperationsIndex, OperationsIndexEntity } from '@zro/operations/domain';

@Table({
  schema: 'pg_catalog',
  tableName: 'pg_indexes',
  timestamps: false,
})
export class OperationsIndexModel
  extends DatabaseModel
  implements OperationsIndex
{
  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'schemaname',
  })
  schemaName: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'tablename',
  })
  tableName: string;

  @PrimaryKey
  @Column({
    type: DataType.STRING,
    field: 'indexname',
  })
  indexName: string;

  @AllowNull(true)
  @Column({
    type: DataType.STRING,
    field: 'indexdef',
  })
  indexDef: string;

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): OperationsIndexEntity {
    return new OperationsIndexEntity(this.get({ plain: true }));
  }
}
