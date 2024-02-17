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
  NotifyRefund,
  NotifyRefundEntity,
  NotifyStateType,
} from '@zro/api-topazio/domain';
import {
  PixRefundReason,
  PixRefundRejectionReason,
  PixRefundStatus,
} from '@zro/pix-payments/domain';

type NotifyRefundAttributes = NotifyRefund;
type NotifyRefundCreationAttributes = NotifyRefundAttributes;

@Table({
  tableName: 'topazio_notify_refunds',
  timestamps: true,
  underscored: true,
})
export class NotifyRefundModel
  extends DatabaseModel<NotifyRefundAttributes, NotifyRefundCreationAttributes>
  implements NotifyRefund
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  solicitationId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  transactionId: string;

  @Column(DataType.BOOLEAN)
  contested: boolean;

  @AllowNull(false)
  @Column(DataType.STRING)
  endToEndId: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('refundAmount'));
    },
  })
  refundAmount: number;

  @Column(DataType.TEXT)
  refundDetails: string;

  @Column(DataType.STRING)
  refundReason: PixRefundReason;

  @Column(DataType.STRING)
  refundRejectionReason?: PixRefundRejectionReason;

  @Column(DataType.STRING)
  refundType?: string;

  @Column(DataType.TEXT)
  refundAnalisysDetails?: string;

  @Column(DataType.STRING)
  refundAnalisysResult?: string;

  @Column(DataType.STRING)
  requesterIspb: string;

  @Column(DataType.STRING)
  responderIspb: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status: PixRefundStatus;

  @Column(DataType.DATE)
  creationDate: Date;

  @Column(DataType.UUID)
  infractionId: string;

  @Column(DataType.STRING)
  devolutionId: string;

  @Column(DataType.DATE)
  lastChangeDate: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: NotifyStateType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: NotifyRefundCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyRefund {
    const entity = new NotifyRefundEntity(this.get({ plain: true }));
    return entity;
  }
}
