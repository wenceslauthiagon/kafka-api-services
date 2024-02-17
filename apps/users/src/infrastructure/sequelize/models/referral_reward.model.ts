import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  ReferralReward,
  ReferralRewardEntity,
  User,
  UserEntity,
} from '@zro/users/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { UserModel } from './user.model';

export type ReferralRewardAttributes = ReferralReward & {
  awardedToId?: User['id'];
  awardedToUuid?: User['uuid'];
  awardedById?: User['id'];
  awardedByUuid?: User['uuid'];
  operationId?: Operation['id'];
  paymentOperationId?: Operation['id'];
};
export type ReferralRewardCreationAttributes = Optional<
  ReferralRewardAttributes,
  'id'
>;

@Table({
  tableName: 'Referral_rewards',
  timestamps: true,
  underscored: true,
})
export class ReferralRewardModel
  extends Model<ReferralRewardAttributes, ReferralRewardCreationAttributes>
  implements ReferralReward
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'awarded_to' })
  awardedToId!: number;

  @AllowNull(true)
  @Column(DataType.UUID)
  awardedToUuid?: string;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: 'awarded_by' })
  awardedById!: number;

  @AllowNull(true)
  @Column(DataType.UUID)
  awardedByUuid?: string;

  @IsUUID(4)
  @Unique
  @AllowNull(false)
  @Column(DataType.UUID)
  operationId!: string;
  operation!: Operation;

  @IsUUID(4)
  @AllowNull(true)
  @Column(DataType.UUID)
  paymentOperationId?: string;
  paymentOperation?: Operation;

  @IsUUID(4)
  @AllowNull(true)
  @Column({ type: DataType.UUID, field: 'group_id' })
  group?: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount!: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => UserModel)
  awardedTo: UserModel;

  @BelongsTo(() => UserModel)
  awardedBy: UserModel;

  constructor(
    values?: ReferralRewardCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.awardedToId = values?.awardedToId ?? values?.awardedTo?.id;
    this.awardedToUuid =
      values?.awardedToUuid ?? values?.awardedTo?.uuid ?? null;
    this.awardedById = values?.awardedById ?? values?.awardedBy?.id;
    this.awardedByUuid =
      values?.awardedByUuid ?? values?.awardedBy?.uuid ?? null;
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.paymentOperationId =
      values?.paymentOperationId ?? values?.paymentOperation?.id ?? null;
    this.group = values?.group ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): ReferralReward {
    const entity = new ReferralRewardEntity(this.get({ plain: true }));
    entity.operation = new OperationEntity({ id: this.operationId });
    entity.paymentOperation = this.paymentOperationId
      ? new OperationEntity({ id: this.paymentOperationId })
      : null;

    // The awarded exists if the ReferralReward repository includes the userModel in the query,
    // otherwise, only the awardedId exists.
    if (this.awardedTo) {
      entity.awardedTo = this.awardedTo.toDomain();
    } else if (this.awardedToId || this.awardedToUuid) {
      entity.awardedTo = new UserEntity({
        ...(this.awardedToId && { id: this.awardedToId }),
        ...(this.awardedToUuid && { uuid: this.awardedToUuid }),
      });
    } else {
      entity.awardedTo = null;
    }

    if (this.awardedBy) {
      entity.awardedBy = this.awardedBy.toDomain();
    } else if (this.awardedById || this.awardedByUuid) {
      entity.awardedBy = new UserEntity({
        ...(this.awardedById && { id: this.awardedById }),
        ...(this.awardedByUuid && { uuid: this.awardedByUuid }),
      });
    } else {
      entity.awardedBy = null;
    }

    return entity;
  }
}
