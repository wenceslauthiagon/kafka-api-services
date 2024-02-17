import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Admin, AdminEntity } from '@zro/admin/domain';

export type AdminAttributes = Admin;
export type AdminCreationAttributes = Optional<AdminAttributes, 'id'>;

@Table({
  tableName: 'Admins',
  timestamps: true,
  underscored: true,
})
export class AdminModel
  extends Model<AdminAttributes, AdminCreationAttributes>
  implements Admin
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
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

  @AllowNull(false)
  @Column(DataType.INTEGER)
  roleId: number;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  active: boolean;

  @AllowNull(true)
  @Column(DataType.STRING)
  resetToken: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  tokenExpirationTime: Date;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  tokenAttempt: number;

  @AllowNull(true)
  @Column(DataType.STRING)
  rrClass: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: AdminCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Admin {
    const entity = new AdminEntity(this.get({ plain: true }));
    return entity;
  }
}
