import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  Default,
  Validate,
} from 'sequelize-typescript';
import { Moment } from 'moment';
import { BuildOptions } from 'sequelize';
import { DatabaseModel, validateHourTimeFormat } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Spread, SpreadEntity } from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';

type SpreadAttributes = Spread & {
  userId?: string;
  currencyId?: number;
  currencySymbol?: string;
};
type SpreadCreationAttributes = SpreadAttributes;

@Table({
  tableName: 'spreads',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class SpreadModel
  extends DatabaseModel<SpreadAttributes, SpreadCreationAttributes>
  implements Spread
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  userId?: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  currencyId: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  currencySymbol: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  buy: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  sell: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  amount: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  offMarketBuy?: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  offMarketSell?: number;

  @AllowNull(true)
  @Validate({ validateHourTimeFormat })
  @Column(DataType.STRING)
  offMarketTimeStart?: string;

  @AllowNull(true)
  @Validate({ validateHourTimeFormat })
  @Column(DataType.STRING)
  offMarketTimeEnd?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  user?: User;
  currency: Currency;

  constructor(values?: SpreadCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid ?? null;
    this.currencyId = values?.currencyId ?? values?.currency?.id;
    this.currencySymbol = values?.currencySymbol ?? values?.currency?.symbol;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Spread {
    const entity = new SpreadEntity(this.get({ plain: true }));
    entity.user = this.userId && new UserEntity({ uuid: this.userId });
    entity.currency = new CurrencyEntity({
      id: this.currencyId,
      symbol: this.currencySymbol,
    });
    return entity;
  }

  get buyFloat(): number {
    return this.toDomain().buyFloat;
  }

  get sellFloat(): number {
    return this.toDomain().sellFloat;
  }

  get offMarketBuyFloat(): number {
    return this.toDomain().offMarketBuyFloat;
  }

  get offMarketSellFloat(): number {
    return this.toDomain().offMarketSellFloat;
  }

  isInOffMarketInterval(base: Moment): boolean {
    return this.toDomain().isInOffMarketInterval(base);
  }

  hasOffMarketInterval(): boolean {
    return this.toDomain().hasOffMarketInterval();
  }
}
