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
import { System, SystemEntity } from '@zro/otc/domain';

type SystemAttributes = System;
type SystemCreationAttributes = SystemAttributes;

@Table({
  tableName: 'systems',
  timestamps: true,
  underscored: true,
})
export class SystemModel
  extends DatabaseModel<SystemAttributes, SystemCreationAttributes>
  implements System
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

  constructor(values?: SystemCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): System {
    const entity = new SystemEntity(this.get({ plain: true }));
    return entity;
  }
}
