import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  BankingTed,
  BankingTedEntity,
  BankingTedFailure,
  BankingTedFailureEntity,
} from '@zro/banking/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';

type BankingTedFailureAttributes = BankingTedFailure & {
  operationId?: string;
  bankingTedId?: number;
};
type BankingTedFailureCreationAttributes = BankingTedFailureAttributes;

@Table({
  tableName: 'BankingTedFailures',
  timestamps: true,
  underscored: true,
})
export class BankingTedFailureModel
  extends DatabaseModel<
    BankingTedFailureAttributes,
    BankingTedFailureCreationAttributes
  >
  implements BankingTedFailure
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;
  operation: Operation;

  @Column({
    type: DataType.UUID,
    field: 'transaction_uuid',
  })
  transactionId?: string;

  @Column(DataType.INTEGER)
  bankingTedId?: number;
  bankingTed?: BankingTed;

  @Column(DataType.STRING)
  failureCode?: string;

  @Column(DataType.STRING)
  failureMessage?: string;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  constructor(
    values?: BankingTedFailureCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.bankingTedId = values?.bankingTedId ?? values?.bankingTed?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BankingTedFailure {
    const entity = new BankingTedFailureEntity(this.get({ plain: true }));
    entity.operation = new OperationEntity({
      id: this.operationId,
    });
    entity.bankingTed = new BankingTedEntity({
      id: this.bankingTedId,
    });

    return entity;
  }
}
