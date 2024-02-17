import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { Plan, PlanEntity } from '@zro/pix-zro-pay/domain';

type PlanAttributes = Plan;
type PlanCreationAttributes = PlanAttributes;

@Table({
  tableName: 'plans',
  timestamps: true,
  underscored: true,
})
export class PlanModel
  extends DatabaseModel<PlanAttributes, PlanCreationAttributes>
  implements Plan
{
  @PrimaryKey
  @AllowNull(false)
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('id'));
    },
  })
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.INTEGER)
  feeCashinInCents?: number;

  @Column(DataType.INTEGER)
  feeCashinInPercent?: number;

  @Column(DataType.INTEGER)
  feeCashoutInCents?: number;

  @Column(DataType.INTEGER)
  feeCashoutInPercent?: number;

  @Column(DataType.INTEGER)
  feeRefundInCents?: number;

  @Column(DataType.INTEGER)
  feeRefundInPercent?: number;

  @Column(DataType.INTEGER)
  onHoldTimeInHours?: number;

  @Column(DataType.INTEGER)
  qrCodeMinValueInCents?: number;

  @Column(DataType.INTEGER)
  qrCodeMaxValueInCents?: number;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(values?: PlanAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Plan {
    const entity = new PlanEntity(this.get({ plain: true }));

    return entity;
  }
}
