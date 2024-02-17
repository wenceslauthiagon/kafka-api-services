import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  UserForgotPassword,
  UserForgotPasswordEntity,
  UserForgotPasswordState,
  UserEntity,
} from '@zro/users/domain';
import { UserModel } from './user.model';

export type UserForgotPasswordAttributes = UserForgotPassword & {
  userId?: string;
};

export type UserForgotPasswordCreationAttributes = Optional<
  UserForgotPasswordAttributes,
  'id'
>;

@Table({
  tableName: 'users_forgot_passwords',
  timestamps: true,
  underscored: true,
})
export class UserForgotPasswordModel
  extends Model<
    UserForgotPasswordAttributes,
    UserForgotPasswordCreationAttributes
  >
  implements UserForgotPassword
{
  @PrimaryKey
  @IsUUID(4)
  @Unique
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Default(UserForgotPasswordState.PENDING)
  @Column(DataType.STRING)
  state: UserForgotPasswordState;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  phoneNumber?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  email?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  code: string;

  @Default(0)
  @Column(DataType.INTEGER)
  attempts: number;

  @AllowNull(true)
  @Column(DataType.DATE)
  expiredAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  constructor(
    values?: UserForgotPasswordCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserForgotPassword {
    const entity = new UserForgotPasswordEntity(this.get({ plain: true }));

    // The user exists if the repository included the userModel in the query,
    // otherwise, only the userId exists.
    if (this.user) {
      entity.user = this.user.toDomain();
    } else if (this.userId) {
      entity.user = new UserEntity({ uuid: this.userId });
    }

    return entity;
  }

  isAlreadyConfirmed(): boolean {
    return this.toDomain().isAlreadyConfirmed();
  }
  isAlreadyInvalid(): boolean {
    return this.toDomain().isAlreadyInvalid();
  }
}
