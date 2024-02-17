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
import { BankTed, BankTedEntity } from '@zro/banking/domain';

type BankTedAttributes = BankTed;
type BankTedCreationAttributes = BankTedAttributes;

@Table({
  tableName: 'bank_teds',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class BankTedModel
  extends DatabaseModel<BankTedAttributes, BankTedCreationAttributes>
  implements BankTed
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  ispb!: string;

  @AllowNull(false)
  @Unique
  @Column(DataType.STRING)
  code!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  fullName!: string;

  @AllowNull(true)
  @Default(false)
  @Column(DataType.BOOLEAN)
  active?: boolean;

  @AllowNull(false)
  @Column(DataType.DATE)
  startedAt!: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  deletedAt: Date;

  constructor(values?: BankTedCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BankTed {
    const entity = new BankTedEntity(this.get({ plain: true }));
    return entity;
  }
}
