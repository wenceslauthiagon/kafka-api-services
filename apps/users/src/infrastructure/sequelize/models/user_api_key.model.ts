import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  UserApiKey,
  UserApiKeyEntity,
  User,
  UserEntity,
} from '@zro/users/domain';

export type UserApiKeyAttributes = UserApiKey & {
  userId: User['uuid'];
};
export type UserApiKeyCreationAttributes = UserApiKeyAttributes;

@Table({
  tableName: 'users_api_keys',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class UserApiKeyModel
  extends Model<UserApiKeyAttributes, UserApiKeyCreationAttributes>
  implements UserApiKey
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  hash!: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(values?: UserApiKeyCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserApiKey {
    const entity = new UserApiKeyEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });

    return entity;
  }
}
