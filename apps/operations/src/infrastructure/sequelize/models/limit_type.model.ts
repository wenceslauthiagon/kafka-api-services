import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional, BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  LimitType,
  LimitTypeEntity,
  LimitTypeCheck,
  LimitTypePeriodStart,
  Currency,
  TransactionType,
  CurrencyEntity,
  TransactionTypeEntity,
} from '@zro/operations/domain';
import { CurrencyModel } from './currency.model';
import { TransactionTypeModel } from './transaction_type.model';

export type LimitTypeAttributes = LimitType & {
  currencyId?: number;
};
export type LimitTypeCreationAttributes = Optional<LimitTypeAttributes, 'id'>;

@Table({
  tableName: 'Limit_types',
  timestamps: true,
  underscored: true,
})
export class LimitTypeModel
  extends DatabaseModel<LimitTypeAttributes, LimitTypeCreationAttributes>
  implements LimitType
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  tag!: string;

  @Column(DataType.STRING)
  description?: string;

  @ForeignKey(() => CurrencyModel)
  @Column(DataType.INTEGER)
  currencyId?: number;

  @AllowNull(false)
  @Default(LimitTypePeriodStart.DATE)
  @Column(DataType.ENUM({ values: Object.values(LimitTypePeriodStart) }))
  periodStart!: LimitTypePeriodStart;

  @AllowNull(false)
  @Default(LimitTypeCheck.OWNER)
  @Column(DataType.ENUM({ values: Object.values(LimitTypeCheck) }))
  check!: LimitTypeCheck;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @BelongsTo(() => CurrencyModel)
  currency?: Currency;

  @HasMany(() => TransactionTypeModel)
  transactionTypes: TransactionType[];

  constructor(values?: LimitTypeCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.currencyId = values?.currencyId ?? values?.currency?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): LimitTypeEntity {
    const entity = new LimitTypeEntity(this.get({ plain: true }));

    if (this.currencyId) {
      entity.currency = new CurrencyEntity({ id: this.currencyId });
    }

    if (this.transactionTypes) {
      entity.transactionTypes = this.transactionTypes.map(
        (transactionType) =>
          new TransactionTypeEntity({ id: transactionType.id }),
      );
    }

    return entity;
  }
}
