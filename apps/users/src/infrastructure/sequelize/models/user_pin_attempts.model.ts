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
  UserPinAttempts,
  UserPinAttemptsEntity,
} from '@zro/users/domain';
import { UserModel } from './user.model';

export type UserPinAttemptsAttributes = UserPinAttempts & { userId?: number };
export type UserPinAttemptsCreationAttributes = Optional<
  UserPinAttemptsAttributes,
  'id'
>;

@Table({
  tableName: 'Users_pin_attempts',
  timestamps: true,
  underscored: true,
})
export class UserPinAttemptsModel
  extends Model<UserPinAttemptsAttributes, UserPinAttemptsCreationAttributes>
  implements UserPinAttempts
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  uuid: string;

  @ForeignKey(() => UserModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId!: number;

  @Default(0)
  @Column(DataType.INTEGER)
  attempts: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  constructor(
    values?: UserPinAttemptsCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserPinAttempts {
    const entity = new UserPinAttemptsEntity(this.get({ plain: true }));

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
