import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  CryptoMarket,
  CryptoMarketEntity,
  CryptoRemittance,
  CryptoRemittanceEntity,
  OrderSide,
  CryptoRemittanceStatus,
  OrderType,
  Provider,
  ProviderEntity,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';

type CryptoRemittanceAttributes = CryptoRemittance & {
  baseCurrencyId: Currency['id'];
  baseCurrencySymbol: Currency['symbol'];
  baseCurrencyDecimal: Currency['decimal'];
  baseCurrencyType: Currency['type'];
  quoteCurrencyId: Currency['id'];
  quoteCurrencySymbol: Currency['symbol'];
  quoteCurrencyDecimal: Currency['decimal'];
  quoteCurrencyType: Currency['type'];
  marketName: CryptoMarket['name'];
  priceSignificantDigits?: CryptoMarket['priceSignificantDigits'];
  providerId?: Provider['id'];
};

@Table({
  tableName: 'crypto_remittances',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class CryptoRemittanceModel
  extends DatabaseModel<CryptoRemittanceAttributes>
  implements CryptoRemittance
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  baseCurrencyId: Currency['id'];

  @AllowNull(false)
  @Column(DataType.STRING)
  baseCurrencySymbol: Currency['symbol'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  baseCurrencyDecimal: Currency['decimal'];

  @AllowNull(false)
  @Column(DataType.STRING)
  baseCurrencyType: Currency['type'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  quoteCurrencyId: Currency['id'];

  @AllowNull(false)
  @Column(DataType.STRING)
  quoteCurrencySymbol: Currency['symbol'];

  @AllowNull(false)
  @Column(DataType.INTEGER)
  quoteCurrencyDecimal: Currency['decimal'];

  @AllowNull(false)
  @Column(DataType.STRING)
  quoteCurrencyType: Currency['type'];

  @AllowNull(false)
  @Column(DataType.STRING)
  marketName: string;

  @AllowNull(false)
  @Column(DataType.JSONB)
  market: CryptoMarket;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: OrderType;

  @AllowNull(false)
  @Column(DataType.STRING)
  side: OrderSide;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('price')
        ? parseInt(this.getDataValue('price'))
        : null;
    },
  })
  price?: number;

  @Column(DataType.INTEGER)
  priceSignificantDigits?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('amount')
        ? parseInt(this.getDataValue('amount'))
        : null;
    },
  })
  stopPrice?: number;

  @Column(DataType.DATE)
  validUntil?: Date;

  @Column(DataType.STRING)
  providerId?: string;

  @Column(DataType.STRING)
  providerOrderId?: string;

  @Column(DataType.STRING)
  providerName?: string;

  @Column(DataType.STRING)
  status: CryptoRemittanceStatus;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('executedPrice')
        ? parseInt(this.getDataValue('executedPrice'))
        : null;
    },
  })
  executedPrice?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('executedAmount')
        ? parseInt(this.getDataValue('executedAmount'))
        : null;
    },
  })
  executedAmount?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return this.getDataValue('fee')
        ? parseInt(this.getDataValue('fee'))
        : null;
    },
  })
  fee?: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  baseCurrency: Currency;
  quoteCurrency: Currency;
  provider?: Provider;

  constructor(values?: CryptoRemittanceAttributes, options?: BuildOptions) {
    super(values, options);
    this.baseCurrencyId = values?.baseCurrencyId ?? values?.baseCurrency?.id;
    this.baseCurrencySymbol =
      values?.baseCurrencySymbol ?? values?.baseCurrency?.symbol;
    this.baseCurrencyDecimal =
      values?.baseCurrencyDecimal ?? values?.baseCurrency?.decimal;
    this.baseCurrencyType =
      values?.baseCurrencyType ?? values?.baseCurrency?.type;
    this.quoteCurrencyId = values?.quoteCurrencyId ?? values?.quoteCurrency?.id;
    this.quoteCurrencySymbol =
      values?.quoteCurrencySymbol ?? values?.quoteCurrency?.symbol;
    this.quoteCurrencyDecimal =
      values?.quoteCurrencyDecimal ?? values?.quoteCurrency?.decimal;
    this.quoteCurrencyType =
      values?.quoteCurrencyType ?? values?.quoteCurrency?.type;
    this.marketName = values?.marketName ?? values?.market?.name;
    this.providerId = values?.providerId ?? values?.provider?.id;
    this.providerName = values?.providerName ?? values?.provider?.name;
    this.priceSignificantDigits =
      values?.priceSignificantDigits ?? values?.market?.priceSignificantDigits;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): CryptoRemittance {
    const entity = new CryptoRemittanceEntity(this.get({ plain: true }));

    entity.baseCurrency = new CurrencyEntity({
      id: this.baseCurrencyId,
      symbol: this.baseCurrencySymbol,
      decimal: this.baseCurrencyDecimal,
      type: this.baseCurrencyType,
    });

    entity.quoteCurrency = new CurrencyEntity({
      id: this.quoteCurrencyId,
      symbol: this.quoteCurrencySymbol,
      decimal: this.quoteCurrencyDecimal,
      type: this.quoteCurrencyType,
    });

    entity.market = new CryptoMarketEntity({
      ...entity.market,
      name: this.marketName,
      priceSignificantDigits: this.priceSignificantDigits,
    });

    entity.provider =
      this.providerId &&
      new ProviderEntity({
        id: this.providerId,
        name: this.providerName,
      });

    return entity;
  }
}
