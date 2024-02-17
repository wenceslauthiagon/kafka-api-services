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
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import {
  Provider,
  ProviderEntity,
  RemittanceOrder,
  RemittanceOrderEntity,
  System,
  SystemEntity,
  RemittanceOrderSide,
  RemittanceOrderStatus,
  CryptoRemittance,
  CryptoRemittanceEntity,
  SettlementDateCode,
  RemittanceOrderType,
} from '@zro/otc/domain';

type RemittanceOrderAttributes = RemittanceOrder & {
  currencyId: number;
  systemId: string;
  providerId: string;
  cryptoRemittanceId?: string;
};
type RemittanceOrderCreationAttributes = RemittanceOrderAttributes;

@Table({
  tableName: 'remittance_orders',
  timestamps: true,
  underscored: true,
})
export class RemittanceOrderModel
  extends DatabaseModel<
    RemittanceOrderAttributes,
    RemittanceOrderCreationAttributes
  >
  implements RemittanceOrder
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  side: RemittanceOrderSide;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  currencyId: number;
  currency: Currency;

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
  status: RemittanceOrderStatus;

  @AllowNull(false)
  @Column(DataType.UUID)
  systemId: string;
  system: System;

  @AllowNull(false)
  @Column(DataType.UUID)
  providerId: string;
  provider: Provider;

  @Column(DataType.UUID)
  cryptoRemittanceId?: string;
  cryptoRemittance?: CryptoRemittance;

  @Column(DataType.STRING)
  sendDateCode?: SettlementDateCode;

  @Column(DataType.STRING)
  receiveDateCode?: SettlementDateCode;

  @Column(DataType.STRING)
  type?: RemittanceOrderType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: RemittanceOrderCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);

    this.currencyId = values?.currencyId ?? values?.currency?.id;
    this.systemId = values?.systemId ?? values?.system?.id;
    this.providerId = values?.providerId ?? values?.provider?.id;
    this.cryptoRemittanceId =
      values?.cryptoRemittanceId ?? values?.cryptoRemittance?.id ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): RemittanceOrder {
    const entity = new RemittanceOrderEntity(this.get({ plain: true }));

    entity.currency = new CurrencyEntity({
      id: this.currencyId,
    });

    entity.system = new SystemEntity({
      id: this.systemId,
    });

    entity.provider = new ProviderEntity({
      id: this.providerId,
    });

    entity.cryptoRemittance =
      this.cryptoRemittanceId &&
      new CryptoRemittanceEntity({ id: this.cryptoRemittanceId });

    delete entity['currencyId'];
    delete entity['systemId'];
    delete entity['providerId'];
    delete entity['cryptoRemittanceId'];

    return entity;
  }
}
