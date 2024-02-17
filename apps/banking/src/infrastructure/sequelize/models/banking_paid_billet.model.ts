import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  BankingPaidBillet,
  BankingPaidBilletConciliationStatus,
  BankingPaidBilletDockStatus,
  BankingPaidBilletEntity,
} from '@zro/banking/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';

type BankingPaidBilletAttributes = BankingPaidBillet & {
  operationId: Operation['id'];
};
type BankingPaidBilletCreationAttributes = BankingPaidBilletAttributes;

@Table({
  tableName: 'BankingPaidBillets',
  timestamps: true,
  underscored: true,
})
export class BankingPaidBilletModel
  extends DatabaseModel<
    BankingPaidBilletAttributes,
    BankingPaidBilletCreationAttributes
  >
  implements BankingPaidBillet
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: Operation['id'];
  operation: Operation;

  @AllowNull(true)
  @Column(DataType.STRING)
  barcode: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  typeableLine: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  assignor: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  assignorDocument: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  dockAdjustmentId: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  dockTransactionCode: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  dockPaymentConfirmationId: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  dockStatus: BankingPaidBilletDockStatus;

  @AllowNull(true)
  @Column({
    type: DataType.DATEONLY,
    field: 'dueDate',
  })
  dueDate: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  settledDate: Date;

  @AllowNull(true)
  @Column(DataType.STRING)
  transactionIdPayment: string;

  @AllowNull(true)
  @Default(BankingPaidBilletConciliationStatus.PENDING)
  @Column(DataType.STRING)
  conciliationStatus: BankingPaidBilletConciliationStatus;

  @AllowNull(true)
  @Column(DataType.STRING)
  failureMessage: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @AllowNull(true)
  @Column(DataType.UUID)
  transactionId: string;

  constructor(
    values?: BankingPaidBilletCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BankingPaidBillet {
    const entity = new BankingPaidBilletEntity(this.get({ plain: true }));

    entity.operation = new OperationEntity({
      id: this.operationId,
    });

    delete entity['operationId'];

    return entity;
  }
}
