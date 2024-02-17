import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { Provider, ProviderEntity } from '@zro/otc/domain';

type ProviderAttributes = Provider;
type ProviderCreationAttributes = ProviderAttributes;

@Table({
  tableName: 'Providers',
  timestamps: true,
  underscored: true,
})
export class ProviderModel
  extends DatabaseModel<ProviderAttributes, ProviderCreationAttributes>
  implements Provider
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  description?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: ProviderCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Provider {
    const entity = new ProviderEntity(this.get({ plain: true }));
    return entity;
  }
}
