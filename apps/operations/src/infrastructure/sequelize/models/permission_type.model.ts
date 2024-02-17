import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import { PermissionType, PermissionTypeEntity } from '@zro/operations/domain';

export type PermissionTypeAttributes = PermissionType;
export type PermissionTypeCreationAttributes = PermissionTypeAttributes;

@Table({
  tableName: 'permission_types',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class PermissionTypeModel
  extends Model<PermissionTypeAttributes, PermissionTypeCreationAttributes>
  implements PermissionType
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  tag: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  description?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(
    values?: PermissionTypeCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PermissionType {
    const entity = new PermissionTypeEntity(this.get({ plain: true }));
    return entity;
  }
}
