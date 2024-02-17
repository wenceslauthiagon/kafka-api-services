import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  UserEntity,
  UserOnboarding,
  UserOnboardingEntity,
} from '@zro/users/domain';
import { UserModel } from './user.model';

export type UserOnboardingAttributes = UserOnboarding & { userId?: number };
export type UserOnboardingCreationAttributes = Optional<
  UserOnboardingAttributes,
  'id'
>;

@Table({
  tableName: 'Users_onboardings',
  timestamps: true,
  underscored: true,
})
export class UserOnboardingModel
  extends Model<UserOnboardingAttributes, UserOnboardingCreationAttributes>
  implements UserOnboarding
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId!: number;

  @Default('')
  @AllowNull(false)
  @Column(DataType.STRING)
  birth_date: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  birth_date_comment: string;

  @Default('')
  @AllowNull(false)
  @Column(DataType.STRING)
  cpf: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  cpf_comment: string;

  @Default('')
  @AllowNull(false)
  @Column(DataType.STRING)
  mother_name: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  mother_name_comment: string;

  @Default('')
  @AllowNull(false)
  @Column(DataType.STRING)
  address: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  address_comment: string;

  @Default('')
  @AllowNull(false)
  @Column(DataType.STRING)
  url_photo_cpf_front: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  url_photo_cpf_front_comment: string;

  @Default('')
  @AllowNull(false)
  @Column(DataType.STRING)
  url_photo_cpf_back: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  url_photo_cpf_back_comment: string;

  @Default('')
  @AllowNull(false)
  @Column(DataType.STRING)
  url_selfie: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  url_selfie_comment: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  registration_id: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  constructor(
    values?: UserOnboardingCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserOnboarding {
    const entity = new UserOnboardingEntity(this.get({ plain: true }));

    // The user exists if the repository included the userModel in the query,
    // otherwise, only the userId exists.
    if (this.user) {
      entity.user = this.user.toDomain();
    } else if (this.userId) {
      entity.user = new UserEntity({ id: this.userId });
    }
    return entity;
  }
}
