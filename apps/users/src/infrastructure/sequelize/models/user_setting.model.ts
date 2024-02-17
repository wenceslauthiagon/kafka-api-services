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
import { UserEntity, UserSetting, UserSettingEntity } from '@zro/users/domain';
import { UserModel } from './user.model';

export type UserSettingAttributes = UserSetting & { userId?: number };
export type UserSettingCreationAttributes = Optional<
  UserSettingAttributes,
  'id'
>;

@Table({
  tableName: 'Users_settings',
  timestamps: true,
  underscored: true,
})
export class UserSettingModel
  extends Model<UserSettingAttributes, UserSettingCreationAttributes>
  implements UserSetting
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

  @Default(1)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  currency_id: number;

  @Default('active')
  @AllowNull(false)
  @Column(DataType.STRING)
  state: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => UserModel)
  user: UserModel;

  constructor(values?: UserSettingCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserSetting {
    const entity = new UserSettingEntity(this.get({ plain: true }));

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
