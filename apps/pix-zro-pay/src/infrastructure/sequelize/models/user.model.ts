import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { User, UserEntity } from '@zro/pix-zro-pay/domain';

type UserAttributes = User;
type UserCreationAttributes = UserAttributes;

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true,
})
export class UserModel
  extends DatabaseModel<UserAttributes, UserCreationAttributes>
  implements User
{
  @PrimaryKey
  @AllowNull(false)
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('id'));
    },
  })
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  password: string;

  @Column(DataType.DATE)
  emailVerifiedAt?: Date;

  @Column(DataType.STRING)
  rememberToken?: string;

  @Column(DataType.STRING)
  phone?: string;

  @Column(DataType.STRING)
  office?: string;

  @Column(DataType.STRING)
  twoFactorSecret?: string;

  @Column(DataType.STRING)
  twoFactorRecoveryCodes?: string;

  @Column(DataType.DATE)
  twoFactorConfirmedAt?: Date;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(values?: UserAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): User {
    const entity = new UserEntity(this.get({ plain: true }));

    return entity;
  }
}
