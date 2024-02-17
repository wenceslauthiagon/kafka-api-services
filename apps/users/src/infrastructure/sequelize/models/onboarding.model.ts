import {
  BelongsTo,
  Column,
  DataType,
  Table,
  Model,
  ForeignKey,
  PrimaryKey,
  AllowNull,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions, Optional } from 'sequelize';

import {
  AddressEntity,
  Onboarding,
  OnboardingEntity,
  OnboardingStatus,
  UserEntity,
} from '@zro/users/domain';
import { UserModel } from './user.model';
import { AddressModel } from './address.model';

type OnboardingAttributes = Onboarding & {
  userId?: number;
  addressId?: number;
  status?: OnboardingStatus;
};

type OnboardingCreationAttributes = Optional<OnboardingAttributes, 'id'>;

@Table({
  tableName: 'Onboardings',
  timestamps: true,
  underscored: true,
})
export class OnboardingModel
  extends Model<OnboardingAttributes, OnboardingCreationAttributes>
  implements Onboarding
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId!: number;

  @ForeignKey(() => AddressModel)
  @Column(DataType.INTEGER)
  addressId?: number;

  @Column({ type: DataType.STRING, field: 'cpf' })
  document?: string;

  @AllowNull(false)
  @Default(OnboardingStatus.PENDING)
  @Column(DataType.STRING)
  status!: OnboardingStatus;

  @Column(DataType.STRING)
  fullName: string;

  @Column({
    type: DataType.STRING,
    field: 'topazio_account_number',
  })
  accountNumber: string;

  @Column({
    type: DataType.BIGINT,
    field: 'occupation_income',
  })
  occupationIncome: number;

  @Column({
    type: DataType.STRING,
    field: 'topazio_branch_number',
  })
  branch: string;

  @Column(DataType.INTEGER)
  reviewAssignee?: number;

  @Column(DataType.INTEGER)
  occupationCbo?: number;

  @Column(DataType.STRING)
  pepSince?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column(DataType.DATE)
  discardedAt: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  @BelongsTo(() => AddressModel)
  address?: AddressModel;

  constructor(values?: OnboardingCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.id;
    this.addressId = values?.addressId ?? values?.address?.id ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Onboarding {
    const entity = new OnboardingEntity(this.get({ plain: true }));

    // The user exists if the onboarding repository includes the userModel in the query,
    // otherwise, only the userId exists.
    if (this.user) {
      entity.user = this.user.toDomain();
    } else if (this.userId) {
      entity.user = new UserEntity({ id: this.userId });
    }

    // The address exists if the onboarding repository includes the addressModel in the query,
    // otherwise, only the addressId exists.
    if (this.address) {
      entity.address = this.address.toDomain();
    } else if (this.addressId) {
      entity.address = new AddressEntity({ id: this.addressId });
    } else {
      entity.address = null;
    }
    return entity;
  }

  isFinished(): boolean {
    return this.toDomain().isFinished();
  }
}
