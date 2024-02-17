import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  UserLimitRequest,
  UserLimitRequestAnalysisResultType,
  UserLimitRequestEntity,
  UserLimitRequestState,
  UserLimitRequestStatus,
} from '@zro/compliance/domain';
import { User, UserEntity } from '@zro/users/domain';
import { UserLimit, UserLimitEntity } from '@zro/operations/domain';

export type UserLimitRequestAttributes = UserLimitRequest & {
  userId?: string;
  userLimitId?: string;
};

export type UserLimitRequestCreationAttributes = Optional<
  UserLimitRequestAttributes,
  'id'
>;

@Table({
  tableName: 'user_limit_requests',
  timestamps: true,
  underscored: true,
})
export class UserLimitRequestModel
  extends Model<UserLimitRequestAttributes, UserLimitRequestCreationAttributes>
  implements UserLimitRequest
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: UserLimitRequestStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: UserLimitRequestState;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userLimitId!: string;

  @Column(DataType.STRING)
  limitTypeDescription?: string;

  @Column(DataType.STRING)
  analysisResult?: UserLimitRequestAnalysisResultType;

  @Column({
    field: 'request_yearly_limit',
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('requestYearlyLimit')
        ? parseInt(this.getDataValue('requestYearlyLimit'))
        : null;
    },
  })
  requestYearlyLimit?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('requestMonthlyLimit')
        ? parseInt(this.getDataValue('requestMonthlyLimit'))
        : null;
    },
  })
  requestMonthlyLimit?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('requestDailyLimit')
        ? parseInt(this.getDataValue('requestDailyLimit'))
        : null;
    },
  })
  requestDailyLimit?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('requestNightlyLimit')
        ? parseInt(this.getDataValue('requestNightlyLimit'))
        : null;
    },
  })
  requestNightlyLimit?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('requestMaxAmount')
        ? parseInt(this.getDataValue('requestMaxAmount'))
        : null;
    },
  })
  requestMaxAmount?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('requestMinAmount')
        ? parseInt(this.getDataValue('requestMinAmount'))
        : null;
    },
  })
  requestMinAmount?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('requestMaxAmountNightly')
        ? parseInt(this.getDataValue('requestMaxAmountNightly'))
        : null;
    },
  })
  requestMaxAmountNightly?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('requestMinAmountNightly')
        ? parseInt(this.getDataValue('requestMinAmountNightly'))
        : null;
    },
  })
  requestMinAmountNightly?: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  user: User;

  userLimit: UserLimit;

  constructor(
    values?: UserLimitRequestCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.userLimitId = values.userLimitId ?? values?.userLimit?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserLimitRequest {
    const entity = new UserLimitRequestEntity(this.get({ plain: true }));

    entity.user = new UserEntity({ uuid: this.userId });

    entity.userLimit = new UserLimitEntity({ id: this.userLimitId });

    return entity;
  }
}
