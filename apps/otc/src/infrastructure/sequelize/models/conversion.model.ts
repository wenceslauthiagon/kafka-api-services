import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  ForeignKey,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  Conversion,
  ConversionEntity,
  OrderSide,
  Provider,
  ProviderEntity,
  Remittance,
  RemittanceEntity,
} from '@zro/otc/domain';
import {
  Currency,
  CurrencyEntity,
  Operation,
  OperationEntity,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { Quotation, QuotationEntity } from '@zro/quotations/domain';
import { ProviderModel } from '@zro/otc/infrastructure';

type ConversionAttributes = Conversion & {
  operationId: string;
  remittanceId?: string;
  userId?: number;
  userUUID?: string;
  providerId?: string;
  quotationId?: string;
  currencyId?: number;
};
type ConversionCreationAttributes = ConversionAttributes;

@Table({
  tableName: 'Conversions',
  timestamps: true,
  underscored: true,
})
export class ConversionModel
  extends DatabaseModel<ConversionAttributes, ConversionCreationAttributes>
  implements Conversion
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;
  operation: Operation;

  @Column(DataType.UUID)
  remittanceId?: string;
  remittance?: Remittance;

  @Column(DataType.INTEGER)
  userId?: number;
  @Column({
    type: DataType.UUID,
    field: 'user_uuid',
  })
  userUUID?: string;
  user?: User;

  @ForeignKey(() => ProviderModel)
  @Column(DataType.UUID)
  providerId?: string;
  provider?: Provider;

  @Column(DataType.UUID)
  quotationId?: string;
  quotation?: Quotation;

  @Column(DataType.INTEGER)
  currencyId?: number;
  currency?: Currency;

  @AllowNull(false)
  @Column(DataType.STRING)
  conversionType: OrderSide;

  @Column(DataType.STRING)
  clientName?: string;

  @Column(DataType.STRING)
  clientDocument?: string;

  @Column({
    type: DataType.BIGINT,
    field: 'btc_amount',
    get(): number {
      if (this.getDataValue('amount'))
        return parseInt(this.getDataValue('amount'));
      return null;
    },
  })
  amount?: number;

  @Column({
    type: DataType.STRING,
    field: 'btc_quote',
  })
  quote?: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('usdQuote'))
        return parseInt(this.getDataValue('usdQuote'));
      return null;
    },
  })
  usdQuote?: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('usdAmount'));
    },
  })
  usdAmount: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('fiatAmount'))
        return parseInt(this.getDataValue('fiatAmount'));
      return null;
    },
  })
  fiatAmount?: number;

  @Column(DataType.UUID)
  tradeId?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: ConversionCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.remittanceId = values?.remittanceId ?? values?.remittance?.id ?? null;
    this.providerId = values?.providerId ?? values?.provider?.id ?? null;
    this.currencyId = values?.currencyId ?? values?.currency?.id ?? null;
    this.quotationId = values?.quotationId ?? values?.quotation?.id ?? null;
    this.userId = values?.userId ?? values?.user?.id ?? null;
    this.userUUID = values?.userUUID ?? values?.user?.uuid ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Conversion {
    const entity = new ConversionEntity(this.get({ plain: true }));
    entity.operation = new OperationEntity({ id: this.operationId });
    entity.remittance = this.remittanceId
      ? new RemittanceEntity({ id: this.remittanceId })
      : null;
    entity.provider = this.providerId
      ? new ProviderEntity({ id: this.providerId })
      : null;
    entity.quotation = this.quotationId
      ? new QuotationEntity({ id: this.quotationId })
      : null;
    entity.currency = this.currencyId
      ? new CurrencyEntity({ id: this.currencyId })
      : null;
    entity.user =
      this.userId || this.userUUID
        ? new UserEntity({
            ...(this.userId && { id: this.userId }),
            ...(this.userUUID && { uuid: this.userUUID }),
          })
        : null;

    return entity;
  }
}
