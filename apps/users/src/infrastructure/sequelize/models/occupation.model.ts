import {
  Column,
  DataType,
  Table,
  Model,
  PrimaryKey,
  AllowNull,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';

import { Occupation, OccupationEntity } from '@zro/users/domain';

type OccupationAttributes = Occupation;

type OccupationCreationAttributes = OccupationAttributes;

@Table({
  tableName: 'Occupations',
  timestamps: true,
  underscored: true,
})
export class OccupationModel
  extends Model<OccupationAttributes, OccupationCreationAttributes>
  implements Occupation
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.INTEGER)
  codCbo: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  cbo: number;

  @Column(DataType.STRING)
  name: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: OccupationCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Occupation {
    const entity = new OccupationEntity(this.get({ plain: true }));

    return entity;
  }
}
