import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  UserConfig,
  UserConfigEntity,
  UserConfigName,
  UserConfigState,
  UserEntity,
  User,
} from '@zro/users/domain';

type UserConfigAttributes = UserConfig & {
  userId?: string;
};

type UserConfigCreationAttributes = UserConfigAttributes;

@Table({
  tableName: 'users_configs',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class UserConfigModel
  extends DatabaseModel<UserConfigAttributes, UserConfigCreationAttributes>
  implements UserConfig
{
  @PrimaryKey
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user!: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: UserConfigName;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: UserConfigState;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(values?: UserConfigAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserConfig {
    const entity = new UserConfigEntity(this.get({ plain: true }));

    entity.user = new UserEntity({ uuid: this.userId });

    delete entity['userId'];

    return entity;
  }
}
