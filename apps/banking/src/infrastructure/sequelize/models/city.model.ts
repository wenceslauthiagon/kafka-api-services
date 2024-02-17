import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Unique,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';

import { DatabaseModel } from '@zro/common';
import { City, CityEntity } from '@zro/banking/domain';

type CityAttributes = City;
type CityCreationAttributes = CityAttributes;

@Table({
  tableName: 'cities',
  timestamps: true,
  underscored: true,
})
export class CityModel
  extends DatabaseModel<CityAttributes, CityCreationAttributes>
  implements City
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  code!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  federativeUnitCode: string;

  @Column(DataType.STRING)
  federativeUnitName: string;

  @Column(DataType.STRING)
  federativeUnitAcronym: string;

  @Column(DataType.STRING)
  regionCode: string;

  @Column(DataType.STRING)
  regionName: string;

  @Column(DataType.STRING)
  regionAcronym: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  active?: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: CityCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): City {
    const entity = new CityEntity(this.get({ plain: true }));
    return entity;
  }
}
