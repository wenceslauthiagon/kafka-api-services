import {
  AllowNull,
  AutoIncrement,
  Column,
  DataType,
  Default,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';
import { Optional } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  Currency,
  CurrencyEntity,
  CurrencyState,
  CurrencySymbolAlign,
  CurrencyType,
} from '@zro/operations/domain';

export type CurrencyAttributes = Currency;
export type CurrencyCreationAttributes = Optional<CurrencyAttributes, 'id'>;

@Table({
  tableName: 'Currencies',
  timestamps: false,
  underscored: true,
})
export class CurrencyModel
  extends DatabaseModel<CurrencyAttributes, CurrencyCreationAttributes>
  implements Currency
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  title!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  symbol!: string;

  @AllowNull(false)
  @Default(CurrencySymbolAlign.LEFT)
  @Column(DataType.STRING)
  symbolAlign!: CurrencySymbolAlign;

  @AllowNull(false)
  @Column(DataType.STRING)
  tag!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  decimal!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  type!: CurrencyType;

  @AllowNull(false)
  @Default(CurrencyState.ACTIVE)
  @Column(DataType.STRING)
  state!: CurrencyState;

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): CurrencyEntity {
    return new CurrencyEntity(this.get({ plain: true }));
  }

  isActive(): boolean {
    return this.toDomain().isActive();
  }
}
