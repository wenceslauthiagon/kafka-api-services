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
  UserPixKeyDecodeLimit,
  UserPixKeyDecodeLimitEntity,
} from '@zro/pix-keys/domain';
import { User, UserEntity } from '@zro/users/domain';

type UserPixKeyDecodeLimitAttributes = UserPixKeyDecodeLimit & {
  userId?: string;
};
type UserPixKeyDecodeLimitCreationAttributes = UserPixKeyDecodeLimitAttributes;

@Table({
  tableName: 'users_pix_key_decode_limits',
  timestamps: true,
  underscored: true,
})
export class UserPixKeyDecodeLimitModel
  extends DatabaseModel<
    UserPixKeyDecodeLimitAttributes,
    UserPixKeyDecodeLimitCreationAttributes
  >
  implements UserPixKeyDecodeLimit
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  limit: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user: User;

  @Column(DataType.DATE)
  lastDecodedCreatedAt?: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: UserPixKeyDecodeLimitCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserPixKeyDecodeLimit {
    const entity = new UserPixKeyDecodeLimitEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    return entity;
  }
}
