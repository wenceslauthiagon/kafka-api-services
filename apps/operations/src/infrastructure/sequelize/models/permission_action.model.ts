import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  PermissionAction,
  PermissionActionEntity,
} from '@zro/operations/domain';
import { PermissionTypeActionModel } from './permission_type_actions.model';

export type PermissionActionAttributes = PermissionAction & {
  permissionTypeActions?: PermissionTypeActionModel[];
};
export type PermissionActionCreationAttributes = PermissionActionAttributes;

@Table({
  tableName: 'permission_actions',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class PermissionActionModel
  extends Model<PermissionActionAttributes, PermissionActionCreationAttributes>
  implements PermissionAction
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

  @HasMany(() => PermissionTypeActionModel, { sourceKey: 'tag' })
  permissionTypeActions: PermissionTypeActionModel[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(
    values?: PermissionActionCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PermissionAction {
    const entity = new PermissionActionEntity(this.get({ plain: true }));
    return entity;
  }
}
