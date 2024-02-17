import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  LimitTypePeriodStart,
  UserLimit,
  UserLimitEntity,
  UserLimitTracker,
  UserLimitTrackerEntity,
} from '@zro/operations/domain';

export type UserLimitTrackerAttributes = UserLimitTracker & {
  userLimitId?: UserLimit['id'];
};

export type UserLimitTrackerCreationAttributes = UserLimitTrackerAttributes;

@Table({
  tableName: 'users_limits_tracker',
  timestamps: true,
  underscored: true,
})
export class UserLimitTrackerModel
  extends DatabaseModel<
    UserLimitTrackerAttributes,
    UserLimitTrackerCreationAttributes
  >
  implements UserLimitTracker
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userLimitId: string;
  userLimit: UserLimit;

  @AllowNull(false)
  @Default(LimitTypePeriodStart.DATE)
  @Column(DataType.ENUM({ values: Object.values(LimitTypePeriodStart) }))
  periodStart: LimitTypePeriodStart;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('usedDailyLimit'));
    },
  })
  usedDailyLimit: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('usedMonthlyLimit'));
    },
  })
  usedMonthlyLimit: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('usedAnnualLimit'));
    },
  })
  usedAnnualLimit: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('usedNightlyLimit'));
    },
  })
  usedNightlyLimit: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: UserLimitTrackerCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userLimitId = values?.userLimitId ?? values?.userLimit?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserLimitTrackerEntity {
    const entity = new UserLimitTrackerEntity(this.get({ plain: true }));
    entity.userLimit = new UserLimitEntity({ id: this.userLimitId });

    delete entity['userLimitId'];

    return entity;
  }
}
