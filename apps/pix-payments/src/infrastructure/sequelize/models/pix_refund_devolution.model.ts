import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel, Failed, FailedEntity } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';
import {
  PixDepositEntity,
  PixDevolutionReceivedEntity,
  PixRefundDevolution,
  PixDevolutionCode,
  PixRefundDevolutionEntity,
  PixRefundDevolutionState,
  PixRefundDevolutionTransaction,
  PixRefundDevolutionTransactionType,
} from '@zro/pix-payments/domain';

type DevolutionAttributes = PixRefundDevolution & {
  userId?: string;
  transactionId?: string;
  operationId?: string;
  failedCode?: string;
  failedMessage?: string;
};
type DevolutionCreationAttributes = DevolutionAttributes;

@Table({
  tableName: 'pix_refund_devolutions',
  timestamps: true,
  underscored: true,
})
export class PixRefundDevolutionModel
  extends DatabaseModel<DevolutionAttributes, DevolutionCreationAttributes>
  implements PixRefundDevolution
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user!: User;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId!: string;
  operation!: Operation;

  @Column(DataType.STRING)
  transactionType: PixRefundDevolutionTransactionType;

  @Column(DataType.UUID)
  transactionId: string;
  transaction: PixRefundDevolutionTransaction;

  @Column(DataType.STRING)
  endToEndId: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount!: number;

  @Column(DataType.STRING)
  devolutionCode: PixDevolutionCode;

  @Column(DataType.STRING)
  description: string;

  @Column(DataType.STRING)
  chargebackReason?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: PixRefundDevolutionState;

  @Column(DataType.STRING)
  failedMessage?: string;

  @Column(DataType.STRING)
  failedCode?: string;
  failed?: Failed;

  @Column(DataType.UUID)
  externalId?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: DevolutionAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.transactionId = values?.transactionId ?? values?.transaction?.id;
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.failedCode = values?.failedCode ?? values?.failed?.code ?? null;
    this.failedMessage =
      values?.failedMessage ?? values?.failed?.message ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixRefundDevolution {
    const entity = new PixRefundDevolutionEntity(this.get({ plain: true }));
    entity.operation = new OperationEntity({ id: this.operationId });
    entity.user = new UserEntity({ uuid: this.userId });
    entity.failed =
      this.failedCode &&
      this.failedMessage &&
      new FailedEntity({
        code: this.failedCode,
        message: this.failedMessage,
      });

    const transactionCases = {
      [PixRefundDevolutionTransactionType.DEPOSIT]: new PixDepositEntity({
        id: this.transactionId,
      }),
      [PixRefundDevolutionTransactionType.DEVOLUTION_RECEIVED]:
        new PixDevolutionReceivedEntity({ id: this.transactionId }),
    };

    entity.transaction =
      this.transactionId && transactionCases[this.transactionType];

    return entity;
  }
}
