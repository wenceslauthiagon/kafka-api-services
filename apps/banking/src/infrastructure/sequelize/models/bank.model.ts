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
import { Bank, BankEntity } from '@zro/banking/domain';

type BankAttributes = Bank;
type BankCreationAttributes = BankAttributes;

@Table({
  tableName: 'banks',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class BankModel
  extends DatabaseModel<BankAttributes, BankCreationAttributes>
  implements Bank
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
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  fullName!: string;

  @AllowNull(false)
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

  constructor(values?: BankCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Bank {
    const entity = new BankEntity(this.get({ plain: true }));
    return entity;
  }

  isSameIspb(ispb: string): boolean {
    return this.toDomain().isSameIspb(ispb);
  }
}
