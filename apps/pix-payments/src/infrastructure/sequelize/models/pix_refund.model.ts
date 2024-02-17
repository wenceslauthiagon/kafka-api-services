import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import {
  DatabaseModel,
  Failed,
  FailedEntity,
  isDateBeforeThan,
  getMoment,
} from '@zro/common';
import {
  PixRefundReason,
  PixRefund,
  PixRefundEntity,
  PixRefundState,
  PixRefundStatus,
  PixRefundRejectionReason,
  PixInfraction,
  PixInfractionEntity,
  PixRefundTransactionType,
  PaymentEntity,
  PixDevolutionEntity,
  PixDevolutionReceivedEntity,
  PixRefundTransaction,
  PixDepositEntity,
  PixRefundDevolution,
  PixRefundDevolutionEntity,
} from '@zro/pix-payments/domain';
import {
  PixInfractionModel,
  PixRefundDevolutionModel,
} from '@zro/pix-payments/infrastructure';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { Bank, BankEntity } from '@zro/banking/domain';

type RefundRequestAttributes = PixRefund & {
  transactionId?: string;
  infractionId?: string;
  operationId?: string;
  failedCode?: string;
  failedMessage?: string;
  requesterIspb?: string;
  responderIspb?: string;
  refundDevolutionId?: string;
};
type RefundRequestCreationAttributes = RefundRequestAttributes;

@Table({
  tableName: 'pix_refunds',
  timestamps: true,
  underscored: true,
})
export class PixRefundModel
  extends DatabaseModel<
    RefundRequestAttributes,
    RefundRequestCreationAttributes
  >
  implements PixRefund
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.UUID)
  solicitationPspId?: string;

  @Column(DataType.INTEGER)
  issueId?: number;

  @Column(DataType.BOOLEAN)
  contested?: boolean;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount: number;

  @Column(DataType.TEXT)
  description?: string;

  @Column(DataType.STRING)
  reason?: PixRefundReason;

  @Column(DataType.STRING)
  transactionType: PixRefundTransactionType;

  @Column(DataType.UUID)
  transactionId: string;
  transaction: PixRefundTransaction;

  @Column(DataType.STRING)
  requesterIspb?: string;

  @Column(DataType.STRING)
  responderIspb?: string;

  requesterBank: Bank;
  responderBank: Bank;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: PixRefundStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: PixRefundState;

  @Column(DataType.TEXT)
  analysisDetails?: string;

  @Column(DataType.STRING)
  rejectionReason?: PixRefundRejectionReason;

  @ForeignKey(() => PixInfractionModel)
  @Column(DataType.UUID)
  infractionId?: string;
  @BelongsTo(() => PixInfractionModel)
  infraction?: PixInfraction;

  @ForeignKey(() => PixRefundDevolutionModel)
  @Column(DataType.UUID)
  refundDevolutionId?: string;
  @BelongsTo(() => PixRefundDevolutionModel)
  refundDevolution?: PixRefundDevolution;

  @Column(DataType.UUID)
  operationId!: string;
  operation!: Operation;

  @Column(DataType.STRING)
  failedMessage?: string;

  @Column(DataType.STRING)
  failedCode?: string;
  failed?: Failed;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: RefundRequestAttributes, options?: BuildOptions) {
    super(values, options);
    this.infractionId = values?.infractionId ?? values?.infraction?.id;
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.transactionId = values?.transactionId ?? values?.transaction?.id;
    this.failedCode = values?.failedCode ?? values?.failed?.code ?? null;
    this.failedMessage =
      values?.failedMessage ?? values?.failed?.message ?? null;
    this.requesterIspb = values?.requesterIspb ?? values?.requesterBank?.ispb;
    this.responderIspb = values?.responderIspb ?? values?.responderBank?.ispb;
    this.refundDevolutionId =
      values?.refundDevolutionId ?? values?.refundDevolution?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixRefund {
    const entity = new PixRefundEntity(this.get({ plain: true }));
    entity.infraction =
      this.infractionId && new PixInfractionEntity({ id: this.infractionId });
    entity.operation =
      this.operationId && new OperationEntity({ id: this.operationId });
    entity.failed =
      this.failedCode &&
      this.failedMessage &&
      new FailedEntity({
        code: this.failedCode,
        message: this.failedMessage,
      });
    entity.requesterBank =
      this.requesterIspb &&
      new BankEntity({
        ispb: this.requesterIspb,
      });
    entity.responderBank =
      this.responderIspb &&
      new BankEntity({
        ispb: this.responderIspb,
      });
    entity.refundDevolution =
      this.refundDevolutionId &&
      new PixRefundDevolutionEntity({ id: this.refundDevolutionId });

    const transactionCases = {
      [PixRefundTransactionType.DEPOSIT]: new PixDepositEntity({
        id: this.transactionId,
      }),
      [PixRefundTransactionType.DEVOLUTION]: new PixDevolutionEntity({
        id: this.transactionId,
      }),
      [PixRefundTransactionType.DEVOLUTION_RECEIVED]:
        new PixDevolutionReceivedEntity({ id: this.transactionId }),
      [PixRefundTransactionType.PAYMENT]: new PaymentEntity({
        id: this.transactionId,
      }),
    };

    entity.transaction =
      this.transactionId && transactionCases[this.transactionType];

    return entity;
  }

  canCreateRefundDevolution(intervalDays: number): boolean {
    return !isDateBeforeThan(
      getMoment(this.createdAt).add(intervalDays, 'day').toDate(),
    );
  }
}
