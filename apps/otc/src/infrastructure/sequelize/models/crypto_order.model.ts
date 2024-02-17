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
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  Conversion,
  ConversionEntity,
  CryptoOrder,
  CryptoOrderEntity,
  CryptoOrderState,
  CryptoRemittance,
  CryptoRemittanceEntity,
  OrderSide,
  OrderType,
  Provider,
  ProviderEntity,
  System,
  SystemEntity,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';
import { ConversionModel } from '@zro/otc/infrastructure';

type CryptoOrderAttributes = CryptoOrder & {
  baseCurrencyId?: Currency['id'];
  userId?: User['uuid'];
  providerId?: Provider['id'];
  conversionId?: Conversion['id'];
  cryptoRemittanceId?: CryptoRemittance['id'];
  remainingCryptoRemittanceId?: CryptoRemittance['id'];
  previousCryptoRemittanceId?: CryptoRemittance['id'];
  systemId: System['id'];
};
type CryptoOrderCreationAttributes = CryptoOrderAttributes;

@Table({
  tableName: 'crypto_orders',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class CryptoOrderModel
  extends DatabaseModel<CryptoOrderAttributes, CryptoOrderCreationAttributes>
  implements CryptoOrder
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  baseCurrencyId: number;
  baseCurrency: Currency;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount: number;

  @Column(DataType.STRING)
  type: OrderType;

  @Column(DataType.STRING)
  side: OrderSide;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: CryptoOrderState;

  @AllowNull(true)
  @Column(DataType.UUID)
  userId?: string;
  user?: User;

  @AllowNull(true)
  @Column(DataType.UUID)
  providerId?: string;
  provider?: Provider;

  @ForeignKey(() => ConversionModel)
  @AllowNull(true)
  @Column(DataType.UUID)
  conversionId?: string;

  @BelongsTo(() => ConversionModel)
  conversion?: ConversionModel;

  @AllowNull(false)
  @Column(DataType.UUID)
  systemId: string;
  system: System;

  @Column(DataType.UUID)
  cryptoRemittanceId?: string;
  cryptoRemittance?: CryptoRemittance;

  @Column(DataType.UUID)
  remainingCryptoRemittanceId?: string;
  remainingCryptoRemittance?: CryptoRemittance;

  @Column(DataType.UUID)
  previousCryptoRemittanceId?: string;
  previousCryptoRemittance: CryptoRemittance;

  @Column(DataType.UUID)
  reconciledId?: string;

  @Column(DataType.STRING)
  clientName: string;

  @Column(DataType.STRING)
  clientDocument: string;

  @Column(DataType.STRING)
  clientDocumentType: string;

  @Column(DataType.BIGINT)
  price?: number;

  @Column(DataType.BIGINT)
  stopPrice?: number;

  @Column(DataType.DATE)
  validUntil?: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(values?: CryptoOrderAttributes, options?: BuildOptions) {
    super(values, options);
    this.baseCurrencyId = values?.baseCurrencyId ?? values?.baseCurrency?.id;
    this.userId = values?.userId ?? values?.user?.uuid;
    this.providerId = values?.providerId ?? values?.provider?.id;
    this.conversionId = values?.conversionId ?? values?.conversion?.id;
    this.systemId = values?.systemId ?? values?.system?.id;
    this.cryptoRemittanceId =
      values?.cryptoRemittanceId ?? values?.cryptoRemittance?.id;
    this.remainingCryptoRemittanceId =
      values?.remainingCryptoRemittanceId ??
      values?.remainingCryptoRemittance?.id;
    this.previousCryptoRemittanceId =
      values?.previousCryptoRemittanceId ??
      values?.previousCryptoRemittance?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): CryptoOrder {
    const entity = new CryptoOrderEntity(this.get({ plain: true }));
    entity.baseCurrency =
      this.baseCurrencyId && new CurrencyEntity({ id: this.baseCurrencyId });
    entity.user = this.userId && new UserEntity({ uuid: this.userId });
    entity.provider =
      this.providerId && new ProviderEntity({ id: this.providerId });

    // The conversion exists if the cryptoOrderRepository includes the conversionModel in the query,
    // otherwise, only the conversionId exists.
    if (this.conversion) {
      entity.conversion = this.conversion.toDomain();
    } else if (this.conversionId) {
      entity.conversion = new ConversionEntity({ id: this.conversionId });
    } else {
      entity.conversion = null;
    }

    entity.system = new SystemEntity({ id: this.systemId });
    entity.cryptoRemittance =
      this.cryptoRemittanceId &&
      new CryptoRemittanceEntity({ id: this.cryptoRemittanceId });
    entity.remainingCryptoRemittance =
      this.remainingCryptoRemittanceId &&
      new CryptoRemittanceEntity({ id: this.remainingCryptoRemittanceId });
    entity.previousCryptoRemittance =
      this.previousCryptoRemittanceId &&
      new CryptoRemittanceEntity({ id: this.previousCryptoRemittanceId });

    return entity;
  }
}
