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
  NotifyInfraction,
  NotifyInfractionEntity,
  NotifyStateType,
} from '@zro/api-topazio/domain';
import {
  PixInfractionAnalysisResultType,
  PixInfractionStatus,
  PixInfractionType,
  PixInfractionReport,
} from '@zro/pix-payments/domain';

type NotifyInfractionAttributes = NotifyInfraction;
type NotifyInfractionCreationAttributes = NotifyInfractionAttributes;

@Table({
  tableName: 'topazio_notify_infractions',
  timestamps: true,
  underscored: true,
})
export class NotifyInfractionModel
  extends DatabaseModel<
    NotifyInfractionAttributes,
    NotifyInfractionCreationAttributes
  >
  implements NotifyInfraction
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.UUID)
  infractionId: string;

  @Column(DataType.UUID)
  operationTransactionId: string;

  @Column(DataType.STRING)
  ispb: string;

  @Column(DataType.STRING)
  endToEndId: string;

  @Column(DataType.STRING)
  infractionType: PixInfractionType;

  @Column(DataType.STRING)
  reportedBy: PixInfractionReport;

  @Column(DataType.TEXT)
  reportDetails: string;

  @Column(DataType.STRING)
  status: PixInfractionStatus;

  @Column(DataType.STRING)
  debitedParticipant: string;

  @Column(DataType.STRING)
  creditedParticipant: string;

  @Column(DataType.DATE)
  creationDate: Date;

  @Column(DataType.DATE)
  lastChangeDate: Date;

  @Column(DataType.STRING)
  analysisResult: PixInfractionAnalysisResultType;

  @Column(DataType.TEXT)
  analysisDetails: string;

  @Column(DataType.BOOLEAN)
  isReporter: boolean;

  @Column(DataType.DATE)
  closingDate: Date;

  @Column(DataType.DATE)
  cancellationDate: Date;

  @Column(DataType.STRING)
  state?: NotifyStateType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyInfractionCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyInfraction {
    const entity = new NotifyInfractionEntity(this.get({ plain: true }));
    return entity;
  }
}
