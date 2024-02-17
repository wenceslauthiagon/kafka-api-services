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
import { Operation, OperationEntity } from '@zro/operations/domain';
import {
  PixInfraction,
  PixInfractionEntity,
  PixInfractionType,
  PixInfractionStatus,
  PixInfractionState,
  PixInfractionAnalysisResultType,
  PixInfractionReport,
  PixInfractionTransactionType,
  PixInfractionTransaction,
  PaymentEntity,
  PixDevolutionReceivedEntity,
  PixDevolutionEntity,
  PixDepositEntity,
} from '@zro/pix-payments/domain';

type PixInfractionAttributes = PixInfraction & {
  operationId?: string;
  transactionId: string;
  failedCode?: string;
  failedMessage?: string;
};
type PixInfractionCreationAttributes = PixInfractionAttributes;

@Table({
  tableName: 'pix_infractions',
  timestamps: true,
  underscored: true,
})
export class PixInfractionModel
  extends DatabaseModel<
    PixInfractionAttributes,
    PixInfractionCreationAttributes
  >
  implements PixInfraction
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.INTEGER)
  issueId?: number;

  @Column(DataType.UUID)
  infractionPspId?: string;

  @Column(DataType.UUID)
  operationId?: string;
  operation?: Operation;

  @AllowNull(false)
  @Column(DataType.TEXT)
  transactionType!: PixInfractionTransactionType;

  @Column(DataType.UUID)
  transactionId?: string;
  transaction: PixInfractionTransaction;

  @Column(DataType.TEXT)
  description?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  infractionType!: PixInfractionType;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: PixInfractionStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: PixInfractionState;

  @Column(DataType.STRING)
  analysisResult?: PixInfractionAnalysisResultType;

  @Column(DataType.STRING)
  reportBy?: PixInfractionReport;

  @Column(DataType.STRING)
  ispbDebitedParticipant?: string;

  @Column(DataType.STRING)
  ispbCreditedParticipant?: string;

  @Column(DataType.STRING)
  ispb?: string;

  @Column(DataType.STRING)
  endToEndId?: string;

  @Column(DataType.DATE)
  creationDate?: Date;

  @Column(DataType.DATE)
  lastChangeDate?: Date;

  @Column(DataType.TEXT)
  analysisDetails?: string;

  @Column(DataType.BOOLEAN)
  isReporter?: boolean;

  @Column(DataType.DATE)
  closingDate?: Date;

  @Column(DataType.DATE)
  cancellationDate?: Date;

  @Column(DataType.STRING)
  failedMessage?: string;

  @Column(DataType.STRING)
  failedCode?: string;
  failed?: Failed;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: PixInfractionAttributes, options?: BuildOptions) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.transactionId = values?.transactionId ?? values?.transaction?.id;
    this.failedCode = values?.failedCode ?? values?.failed?.code ?? null;
    this.failedMessage =
      values?.failedMessage ?? values?.failed?.message ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixInfractionEntity {
    const entity = new PixInfractionEntity(this.get({ plain: true }));
    entity.operation =
      this.operationId && new OperationEntity({ id: this.operationId });
    entity.transaction = { id: this.transactionId };
    entity.failed =
      this.failedCode &&
      this.failedMessage &&
      new FailedEntity({
        code: this.failedCode,
        message: this.failedMessage,
      });
    switch (this.transactionType) {
      case PixInfractionTransactionType.PAYMENT:
        entity.transaction = new PaymentEntity({ id: this.transactionId });
        break;
      case PixInfractionTransactionType.DEPOSIT:
        entity.transaction = new PixDepositEntity({ id: this.transactionId });
      case PixInfractionTransactionType.DEVOLUTION:
        entity.transaction = new PixDevolutionEntity({
          id: this.transactionId,
        });
      case PixInfractionTransactionType.DEVOLUTION_RECEIVED:
        entity.transaction = new PixDevolutionReceivedEntity({
          id: this.transactionId,
        });
      default:
        entity.transaction = { id: this.transactionId };
        break;
    }

    return entity;
  }
}
