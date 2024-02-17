import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { Retry, RetryEntity } from '@zro/utils/domain';

type RetryAttributes = Retry;
type RetryCreationAttributes = RetryAttributes;

@Table({
  tableName: 'retries',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class RetryModel
  extends DatabaseModel<RetryAttributes, RetryCreationAttributes>
  implements Retry
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  counter: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  retryQueue: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  failQueue: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  retryAt: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  abortAt: Date;

  @AllowNull(false)
  @Column(DataType.JSONB)
  data: unknown;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(values?: RetryAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Retry {
    const entity = new RetryEntity(this.get({ plain: true }));
    return entity;
  }
}
