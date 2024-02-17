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
import { AccountType } from '@zro/pix-payments/domain';
import {
  NotifyCredit,
  NotifyCreditEntity,
  OperationType,
  StatusType,
  TransactionType,
  NotifyStateType,
} from '@zro/api-topazio/domain';

type NotifyCreditAttributes = NotifyCredit;
type NotifyCreditCreationAttributes = NotifyCreditAttributes;

@Table({
  tableName: 'topazio_notify_credits',
  timestamps: true,
  underscored: true,
})
export class NotifyCreditModel
  extends DatabaseModel<NotifyCreditAttributes, NotifyCreditCreationAttributes>
  implements NotifyCredit
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  transactionId!: string;

  @Column(DataType.STRING)
  transactionType: TransactionType;

  @Column(DataType.BOOLEAN)
  isDevolution: boolean;

  @Column(DataType.STRING)
  operation: OperationType;

  @Column(DataType.STRING)
  status: StatusType;

  @Column(DataType.STRING)
  statusMessage: string;

  @Column({
    type: DataType.UUID,
    field: 'transaction_original_id',
  })
  transactionOriginalID: string;

  @Column(DataType.STRING)
  reason: string;

  @Column({
    type: DataType.STRING,
    field: 'txid',
  })
  txId: string;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount: number;

  @Column(DataType.STRING)
  clientIspb: string;

  @Column(DataType.STRING)
  clientBranch: string;

  @Column(DataType.STRING)
  clientAccountNumber: string;

  @Column(DataType.STRING)
  clientDocument: string;

  @Column(DataType.STRING)
  clientName: string;

  @Column(DataType.STRING)
  clientKey: string;

  @Column(DataType.STRING)
  thirdPartIspb: string;

  @Column(DataType.STRING)
  thirdPartBranch: string;

  @Column(DataType.STRING)
  thirdPartAccountType: AccountType;

  @Column(DataType.STRING)
  thirdPartAccountNumber: string;

  @Column(DataType.STRING)
  thirdPartDocument: string;

  @Column(DataType.STRING)
  thirdPartName: string;

  @Column(DataType.STRING)
  thirdPartKey: string;

  @Column(DataType.STRING)
  endToEndId: string;

  @Column(DataType.STRING)
  description: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: NotifyStateType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: NotifyCreditCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyCredit {
    const entity = new NotifyCreditEntity(this.get({ plain: true }));
    return entity;
  }

  isValidStatus(): boolean {
    return this.toDomain().isValidStatus();
  }
  isValidTransactionType(): boolean {
    return this.toDomain().isValidTransactionType();
  }
  isValidOperation(): boolean {
    return this.toDomain().isValidOperation();
  }
}
