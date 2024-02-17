import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  PrimaryKey,
  Table,
  UpdatedAt,
  Validate,
} from 'sequelize-typescript';
import { Optional, BuildOptions } from 'sequelize';
import { DatabaseModel, validateHourTimeFormat } from '@zro/common';
import {
  GlobalLimit,
  GlobalLimitEntity,
  LimitType,
  LimitTypeEntity,
} from '@zro/operations/domain';
import { LimitTypeModel } from './limit_type.model';

export type GlobalLimitAttributes = GlobalLimit & {
  limitTypeId?: number;
};

export type GlobalLimitCreationAttributes = Optional<
  GlobalLimitAttributes,
  'id'
>;

@Table({
  tableName: 'Global_limits',
  timestamps: true,
  underscored: true,
})
export class GlobalLimitModel
  extends DatabaseModel<GlobalLimitAttributes, GlobalLimitCreationAttributes>
  implements GlobalLimit
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id?: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('nightlyLimit')
        ? parseInt(this.getDataValue('nightlyLimit'))
        : null;
    },
  })
  nightlyLimit?: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('dailyLimit'));
    },
  })
  dailyLimit: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('monthlyLimit'));
    },
  })
  monthlyLimit: number;

  @AllowNull(false)
  @Column({
    field: 'annual_limit',
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('yearlyLimit'));
    },
  })
  yearlyLimit: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('maxAmount')
        ? parseInt(this.getDataValue('maxAmount'))
        : null;
    },
  })
  maxAmount?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('minAmount')
        ? parseInt(this.getDataValue('minAmount'))
        : null;
    },
  })
  minAmount?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('maxAmountNightly')
        ? parseInt(this.getDataValue('maxAmountNightly'))
        : null;
    },
  })
  maxAmountNightly?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('minAmountNightly')
        ? parseInt(this.getDataValue('minAmountNightly'))
        : null;
    },
  })
  minAmountNightly?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('userMaxAmount')
        ? parseInt(this.getDataValue('userMaxAmount'))
        : null;
    },
  })
  userMaxAmount?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('userMinAmount')
        ? parseInt(this.getDataValue('userMinAmount'))
        : null;
    },
  })
  userMinAmount?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('userMaxAmountNightly')
        ? parseInt(this.getDataValue('userMaxAmountNightly'))
        : null;
    },
  })
  userMaxAmountNightly?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('userMinAmountNightly')
        ? parseInt(this.getDataValue('userMinAmountNightly'))
        : null;
    },
  })
  userMinAmountNightly?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('userNightlyLimit')
        ? parseInt(this.getDataValue('userNightlyLimit'))
        : null;
    },
  })
  userNightlyLimit?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('userDailyLimit')
        ? parseInt(this.getDataValue('userDailyLimit'))
        : null;
    },
  })
  userDailyLimit?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('userMonthlyLimit')
        ? parseInt(this.getDataValue('userMonthlyLimit'))
        : null;
    },
  })
  userMonthlyLimit?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('userYearlyLimit')
        ? parseInt(this.getDataValue('userYearlyLimit'))
        : null;
    },
  })
  userYearlyLimit?: number;

  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('creditBalance'));
    },
  })
  creditBalance?: number;

  @Validate({ validateHourTimeFormat })
  @Column(DataType.STRING)
  nighttimeStart: string;

  @Validate({ validateHourTimeFormat })
  @Column(DataType.STRING)
  nighttimeEnd: string;

  @ForeignKey(() => LimitTypeModel)
  @Column(DataType.INTEGER)
  limitTypeId: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => LimitTypeModel)
  limitType: LimitType;

  constructor(values?: GlobalLimitCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.limitTypeId = values?.limitTypeId ?? values?.limitType?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): GlobalLimitEntity {
    const entity = new GlobalLimitEntity(this.get({ plain: true }));
    entity.limitType = new LimitTypeEntity({ id: this.limitTypeId });

    return entity;
  }
}
