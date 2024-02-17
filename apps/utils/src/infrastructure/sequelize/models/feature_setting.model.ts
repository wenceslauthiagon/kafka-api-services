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
  FeatureSetting,
  FeatureSettingEntity,
  FeatureSettingName,
  FeatureSettingState,
} from '@zro/utils/domain';

type FeatureSettingAttributes = FeatureSetting;
type FeatureSettingCreationAttributes = FeatureSettingAttributes;

@Table({
  tableName: 'feature_settings',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class FeatureSettingModel
  extends DatabaseModel<
    FeatureSettingAttributes,
    FeatureSettingCreationAttributes
  >
  implements FeatureSetting
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: FeatureSettingName;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: FeatureSettingState;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(values?: FeatureSettingAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): FeatureSetting {
    const entity = new FeatureSettingEntity(this.get({ plain: true }));
    return entity;
  }
}
