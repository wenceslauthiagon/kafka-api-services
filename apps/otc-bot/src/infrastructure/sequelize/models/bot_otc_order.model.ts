import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  BotOtc,
  BotOtcEntity,
  BotOtcOrder,
  BotOtcOrderEntity,
  BotOtcOrderState,
} from '@zro/otc-bot/domain';
import {
  CryptoMarket,
  CryptoMarketEntity,
  CryptoOrder,
  CryptoOrderEntity,
  CryptoRemittanceStatus,
  OrderType,
  Provider,
  ProviderEntity,
  Remittance,
  RemittanceEntity,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';

export type BotOtcOrderAttributes = BotOtcOrder & {
  botOtcId: BotOtc['id'];
  baseCurrencyId: Currency['id'];
  baseCurrencySymbol: Currency['symbol'];
  baseCurrencyDecimal: Currency['decimal'];
  baseCurrencyType: Currency['type'];
  quoteCurrencyId: Currency['id'];
  quoteCurrencySymbol: Currency['symbol'];
  quoteCurrencyDecimal: Currency['decimal'];
  quoteCurrencyType: Currency['type'];
  marketName: CryptoMarket['name'];
  sellPriceSignificantDigits: CryptoMarket['priceSignificantDigits'];
  sellProviderId: Provider['id'];
  buyProviderId?: Provider['id'];
  sellOrderId?: CryptoOrder['id'];
  buyOrderId?: CryptoOrder['id'];
  buyBankQuote?: Remittance['bankQuote'];
  buyRemittanceId?: Remittance['id'];
};

export type BotOtcOrderCreationAttributes = BotOtcOrderAttributes;

@Table({
  tableName: 'bot_otc_orders',
  timestamps: true,
  underscored: true,
})
export class BotOtcOrderModel
  extends Model<BotOtcOrderAttributes, BotOtcOrderCreationAttributes>
  implements BotOtcOrder
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: BotOtcOrderState;

  @AllowNull(false)
  @Column(DataType.UUID)
  botOtcId: BotOtc['id'];

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
      return parseInt(this.getDataValue('amount')) || null;
    },
  })
  amount: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: OrderType;

  @AllowNull(false)
  @Column(DataType.STRING)
  sellStatus: CryptoRemittanceStatus;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('sellPrice')) || null;
    },
  })
  sellPrice: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  sellPriceSignificantDigits: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('sellStopPrice')) || null;
    },
  })
  sellStopPrice?: number;

  @Column(DataType.DATE)
  sellValidUntil?: Date;

  @AllowNull(false)
  @Column(DataType.UUID)
  sellProviderId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  sellProviderOrderId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  sellProviderName: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('sellExecutedPrice')) || null;
    },
  })
  sellExecutedPrice?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('sellExecutedAmount')) || null;
    },
  })
  sellExecutedAmount?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('sellFee')) || null;
    },
  })
  sellFee?: number;

  @Column(DataType.UUID)
  buyProviderId?: string;

  @Column(DataType.STRING)
  buyProviderOrderId?: string;

  @Column(DataType.STRING)
  buyProviderName?: string;

  @Column(DataType.INTEGER)
  buyPriceSignificantDigits?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('buyExecutedPrice')) || null;
    },
  })
  buyExecutedPrice?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('buyExecutedAmount')) || null;
    },
  })
  buyExecutedAmount?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('buyFee')) || null;
    },
  })
  buyFee?: number;

  @Column(DataType.UUID)
  sellOrderId?: string;

  @Column(DataType.UUID)
  buyOrderId?: string;

  @Column(DataType.STRING)
  failedCode?: string;

  @Column(DataType.TEXT)
  failedMessage?: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('buyBankQuote')) || null;
    },
  })
  buyBankQuote?: number;

  @Column(DataType.UUID)
  buyRemittanceId?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  botOtc: BotOtc;
  baseCurrency: Currency;
  quoteCurrency: Currency;
  sellProvider: Provider;
  buyProvider?: Provider;
  sellOrder?: CryptoOrder;
  buyOrder?: CryptoOrder;
  buyRemittance?: Remittance;

  constructor(values?: BotOtcOrderCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.botOtcId = values?.botOtcId ?? values?.botOtc?.id;
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
    this.sellProviderId = values?.sellProviderId ?? values?.sellProvider?.id;
    this.sellProviderName =
      values?.sellProviderName ?? values?.sellProvider?.name;
    this.sellPriceSignificantDigits =
      values?.sellPriceSignificantDigits ??
      values?.market?.priceSignificantDigits;
    this.buyProviderId = values?.buyProviderId ?? values?.buyProvider?.id;
    this.buyProviderName = values?.buyProviderName ?? values?.buyProvider?.name;
    this.sellOrderId = values?.sellOrderId ?? values?.sellOrder?.id;
    this.buyOrderId = values?.buyOrderId ?? values?.buyOrder?.id;
    this.buyBankQuote =
      values?.buyBankQuote ?? values?.buyRemittance?.bankQuote;
    this.buyRemittanceId = values?.buyRemittanceId ?? values?.buyRemittance?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BotOtcOrder {
    const entity = new BotOtcOrderEntity(this.get({ plain: true }));

    entity.botOtc = new BotOtcEntity({
      id: this.botOtcId,
    });

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
      priceSignificantDigits: this.sellPriceSignificantDigits,
    });

    entity.sellProvider = new ProviderEntity({
      id: this.sellProviderId,
      name: this.sellProviderName,
    });

    entity.buyProvider =
      this.buyProviderId &&
      new ProviderEntity({
        id: this.buyProviderId,
        name: this.buyProviderName,
      });

    entity.sellOrder =
      this.sellOrderId &&
      new CryptoOrderEntity({
        id: this.sellOrderId,
      });

    entity.buyOrder =
      this.buyOrderId &&
      new CryptoOrderEntity({
        id: this.buyOrderId,
      });

    entity.buyRemittance =
      (this.buyRemittanceId || this.buyBankQuote) &&
      new RemittanceEntity({
        id: this.buyRemittanceId,
        bankQuote: this.buyBankQuote,
      });

    delete entity['botOtcId'];
    delete entity['sellOrderId'];
    delete entity['buyOrderId'];
    delete entity['baseCurrencyId'];
    delete entity['baseCurrencySymbol'];
    delete entity['baseCurrencyDecimal'];
    delete entity['baseCurrencyType'];
    delete entity['quoteCurrencyId'];
    delete entity['quoteCurrencySymbol'];
    delete entity['quoteCurrencyDecimal'];
    delete entity['quoteCurrencyType'];
    delete entity['marketName'];
    delete entity['sellProviderId'];
    delete entity['sellPriceSignificantDigits'];
    delete entity['buyProviderId'];
    delete entity['buyRemittanceId'];
    delete entity['buyBankQuote'];

    return entity;
  }
}
