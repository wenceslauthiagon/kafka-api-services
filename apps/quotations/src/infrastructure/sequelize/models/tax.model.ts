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
import { Tax, TaxEntity } from '@zro/quotations/domain';

type TaxAttributes = Tax;
type TaxCreationAttributes = TaxAttributes;

@Table({
  tableName: 'taxes',
  timestamps: true,
  underscored: true,
})
export class TaxModel
  extends DatabaseModel<TaxAttributes, TaxCreationAttributes>
  implements Tax
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
  @Column(DataType.INTEGER)
  value: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  format: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: TaxCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Tax {
    const entity = new TaxEntity(this.get({ plain: true }));
    return entity;
  }

  get valueFloat(): number {
    return this.toDomain().valueFloat;
  }

  get formattedValue(): string {
    return this.toDomain().formattedValue;
  }
}
