import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  WarningTransaction,
  WarningTransactionAnalysisResultType,
  WarningTransactionEntity,
  WarningTransactionStatus,
} from '@zro/compliance/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';

export type WarningTransactionAttributes = WarningTransaction & {
  operationId?: string;
};

export type WarningTransactionCreationAttributes = WarningTransactionAttributes;

@Table({
  tableName: 'warning_transactions',
  timestamps: true,
  underscored: true,
})
export class WarningTransactionModel
  extends DatabaseModel<
    WarningTransactionAttributes,
    WarningTransactionCreationAttributes
  >
  implements WarningTransaction
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;

  operation: Operation;

  @AllowNull(false)
  @Column(DataType.STRING)
  transactionTag: string;

  @Column(DataType.STRING)
  endToEndId?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: WarningTransactionStatus;

  @Column(DataType.STRING)
  analysisResult?: WarningTransactionAnalysisResultType;

  @Column(DataType.INTEGER)
  issueId?: number;

  @Column(DataType.TEXT)
  reason?: string;

  @Column(DataType.TEXT)
  analysisDetails?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: WarningTransactionAttributes, options?: BuildOptions) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WarningTransaction {
    const entity = new WarningTransactionEntity(this.get({ plain: true }));

    entity.operation = new OperationEntity({
      id: this.operationId,
    });

    return entity;
  }

  isClosed(): boolean {
    return this.toDomain().isClosed();
  }

  isFailed(): boolean {
    return this.toDomain().isFailed();
  }
}
