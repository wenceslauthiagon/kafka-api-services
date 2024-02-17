import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
  createIndexDecorator,
} from 'sequelize-typescript';
import {
  PermissionTypeAction,
  PermissionTypeActionEntity,
  PermissionType,
  PermissionAction,
  PermissionActionEntity,
  PermissionTypeEntity,
} from '@zro/operations/domain';
import { PermissionTypeModel } from './permission_type.model';
import { PermissionActionModel } from './permission_action.model';

export type PermissionTypeActionAttributes = PermissionTypeAction & {
  permissionTypeTag: PermissionType['tag'];
  permissionActionTag: PermissionAction['tag'];
};
export type PermissionTypeActionCreationAttributes =
  PermissionTypeActionAttributes;

const TagUnique = createIndexDecorator({
  name: 'permission_type_actions_both_tag_key',
  unique: true,
});

@Table({
  tableName: 'permission_type_actions',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class PermissionTypeActionModel
  extends Model<
    PermissionTypeActionAttributes,
    PermissionTypeActionCreationAttributes
  >
  implements PermissionTypeAction
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => PermissionTypeModel)
  @AllowNull(false)
  @TagUnique
  @Column(DataType.STRING)
  permissionTypeTag!: PermissionType['tag'];

  @BelongsTo(() => PermissionTypeModel, { targetKey: 'tag' })
  permissionType!: PermissionTypeModel;

  @ForeignKey(() => PermissionActionModel)
  @AllowNull(false)
  @TagUnique
  @Column(DataType.STRING)
  permissionActionTag!: PermissionAction['tag'];

  @BelongsTo(() => PermissionActionModel, { targetKey: 'tag' })
  permissionAction!: PermissionActionModel;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(
    values?: PermissionTypeActionCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.permissionTypeTag =
      values?.permissionTypeTag ?? values?.permissionType?.tag;
    this.permissionActionTag =
      values?.permissionActionTag ?? values?.permissionAction?.tag;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PermissionTypeAction {
    const entity = new PermissionTypeActionEntity(this.get({ plain: true }));

    if (this.permissionType) {
      entity.permissionType = this.permissionType.toDomain();
    } else if (this.permissionTypeTag) {
      entity.permissionType = new PermissionTypeEntity({
        tag: this.permissionTypeTag,
      });
    }

    if (this.permissionAction) {
      entity.permissionAction = this.permissionAction.toDomain();
    } else if (this.permissionActionTag) {
      entity.permissionAction = new PermissionActionEntity({
        tag: this.permissionActionTag,
      });
    }

    delete entity['permissionTypeTag'];
    delete entity['permissionActionTag'];

    return entity;
  }
}
