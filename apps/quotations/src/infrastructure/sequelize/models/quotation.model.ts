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
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  Quotation,
  QuotationEntity,
  StreamPair,
  StreamPairEntity,
  StreamQuotation,
  StreamQuotationEntity,
  Tax,
  TaxEntity,
} from '@zro/quotations/domain';
import {
  Spread,
  SpreadEntity,
  Provider,
  ProviderEntity,
} from '@zro/otc/domain';

type QuotationAttributes = Quotation & {
  iofId?: Tax['id'];
  quoteCurrencyId?: Currency['id'];
  quoteCurrencySymbol?: Currency['symbol'];
  quoteCurrencyTitle?: Currency['title'];
  quoteCurrencyDecimal?: Currency['decimal'];
  baseCurrencyId?: Currency['id'];
  baseCurrencySymbol?: Currency['symbol'];
  baseCurrencyTitle?: Currency['title'];
  baseCurrencyDecimal?: Currency['decimal'];
  spreadIds?: Spread['id'];
  providerName?: Provider['name'];
  streamPairId?: StreamPair['id'];
};
type QuotationCreationAttributes = QuotationAttributes;

@Table({
  tableName: 'quotations',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class QuotationModel
  extends DatabaseModel<QuotationAttributes, QuotationCreationAttributes>
  implements Quotation
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  providerName: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  streamPairId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  side!: Quotation['side'];

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('price'));
    },
  })
  price: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('priceBuy'));
    },
  })
  priceBuy: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('priceSell'));
    },
  })
  priceSell: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('partialBuy'));
    },
  })
  partialBuy: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('partialSell'));
    },
  })
  partialSell: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  iofId: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('iofAmount'));
    },
  })
  iofAmount: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  spreadIds: string;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  spreadBuy: number;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  spreadSell: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('spreadAmountBuy'));
    },
  })
  spreadAmountBuy: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('spreadAmountSell'));
    },
  })
  spreadAmountSell: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  quoteCurrencyId: number;

  @Column(DataType.STRING)
  quoteCurrencySymbol?: string;

  @Column(DataType.STRING)
  quoteCurrencyTitle?: string;

  @Column(DataType.INTEGER)
  quoteCurrencyDecimal?: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('quoteAmountBuy'));
    },
  })
  quoteAmountBuy: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('quoteAmountSell'));
    },
  })
  quoteAmountSell: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  baseCurrencyId: number;

  @Column(DataType.STRING)
  baseCurrencySymbol?: string;

  @Column(DataType.STRING)
  baseCurrencyTitle?: string;

  @Column(DataType.INTEGER)
  baseCurrencyDecimal?: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('baseAmountBuy'));
    },
  })
  baseAmountBuy: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('baseAmountSell'));
    },
  })
  baseAmountSell: number;

  @AllowNull(false)
  @Column(DataType.JSONB)
  streamQuotation!: StreamQuotation;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  iof: Tax;
  spreads: Spread[];
  provider: Provider;
  streamPair: StreamPair;
  quoteCurrency: Currency;
  baseCurrency: Currency;

  constructor(values?: QuotationCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.iofId = values?.iofId ?? values?.iof?.id;
    this.streamPairId = values?.streamPairId ?? values?.streamPair?.id;
    this.providerName = values?.providerName ?? values?.provider?.name;
    this.quoteCurrencyId = values?.quoteCurrencyId ?? values?.quoteCurrency?.id;
    this.quoteCurrencyTitle =
      values?.quoteCurrencyTitle ?? values?.quoteCurrency?.title ?? null;
    this.quoteCurrencySymbol =
      values?.quoteCurrencySymbol ?? values?.quoteCurrency?.symbol ?? null;
    this.quoteCurrencyDecimal =
      values?.quoteCurrencyDecimal ?? values?.quoteCurrency?.decimal ?? null;
    this.baseCurrencyId = values?.baseCurrencyId ?? values?.baseCurrency?.id;
    this.baseCurrencyTitle =
      values?.baseCurrencyTitle ?? values?.baseCurrency?.title ?? null;
    this.baseCurrencySymbol =
      values?.baseCurrencySymbol ?? values?.baseCurrency?.symbol ?? null;
    this.baseCurrencyDecimal =
      values?.baseCurrencyDecimal ?? values?.baseCurrency?.decimal ?? null;
    this.spreadIds =
      values?.spreadIds ?? values?.spreads?.map(({ id }) => id).join(',');
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Quotation {
    const entity = new QuotationEntity(this.get({ plain: true }));
    entity.iof = new TaxEntity({ id: this.iofId });
    entity.provider = new ProviderEntity({ name: this.providerName });
    entity.streamPair = new StreamPairEntity({ id: this.streamPairId });
    entity.quoteCurrency = new CurrencyEntity({
      id: this.quoteCurrencyId,
      title: this.quoteCurrencyTitle,
      symbol: this.quoteCurrencySymbol,
      decimal: this.quoteCurrencyDecimal,
    });
    entity.baseCurrency = new CurrencyEntity({
      id: this.baseCurrencyId,
      title: this.baseCurrencyTitle,
      symbol: this.baseCurrencySymbol,
      decimal: this.baseCurrencyDecimal,
    });
    entity.streamQuotation = new StreamQuotationEntity(this.streamQuotation);
    entity.spreads = this.spreadIds
      .split(',')
      .map((id) => new SpreadEntity({ id: id.trim() }));

    delete entity['iofId'];
    delete entity['spreadIds'];
    delete entity['providerName'];
    delete entity['streamPairId'];
    delete entity['quoteCurrencyId'];
    delete entity['quoteCurrencyTitle'];
    delete entity['quoteCurrencySymbol'];
    delete entity['quoteCurrencyDecimal'];
    delete entity['baseCurrencyId'];
    delete entity['baseCurrencyTitle'];
    delete entity['baseCurrencySymbol'];
    delete entity['baseCurrencyDecimal'];

    return entity;
  }

  get spreadBuyFloat(): number {
    return this.spreadBuy && this.toDomain().spreadBuyFloat;
  }

  get spreadSellFloat(): number {
    return this.spreadSell && this.toDomain().spreadSellFloat;
  }
}
