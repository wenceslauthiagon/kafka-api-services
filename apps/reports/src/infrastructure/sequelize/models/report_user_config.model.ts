import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  ReportUserConfig,
  ReportUserConfigEntity,
  TypeConfig,
} from '@zro/reports/domain';
import { PersonType } from '@zro/users/domain';

type ReportUserConfigAttributes = ReportUserConfig;

type ReportUserConfigCreationAttributes = ReportUserConfigAttributes;

@Table({
  tableName: 'report_users_config',
  timestamps: true,
  underscored: true,
})
export class ReportUserConfigModel
  extends DatabaseModel<
    ReportUserConfigAttributes,
    ReportUserConfigCreationAttributes
  >
  implements ReportUserConfig
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  description: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  typeConfig: TypeConfig;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: ReportUserConfigAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): ReportUserConfig {
    const entity = new ReportUserConfigEntity(this.get({ plain: true }));

    return entity;
  }
}
