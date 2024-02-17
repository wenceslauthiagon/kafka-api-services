import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  HasMany,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  ExchangeContract,
  ExchangeContractEntity,
  Provider,
  ProviderEntity,
  Remittance,
  RemittanceEntity,
  RemittanceSide,
  RemittanceStatus,
  RemittanceType,
  SettlementDateCode,
  System,
  SystemEntity,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { RemittanceOrderRemittanceModel } from '@zro/otc/infrastructure';

type RemittanceAttributes = Remittance & {
  currencyId?: Currency['id'];
  systemId?: System['id'];
  exchangeContractId?: ExchangeContract['id'];
  providerId?: Provider['id'];
  providerName?: Provider['name'];
};

type RemittanceCreationAttributes = RemittanceAttributes;

@Table({
  tableName: 'Remittances',
  timestamps: true,
  underscored: true,
})
export class RemittanceModel
  extends DatabaseModel<RemittanceAttributes, RemittanceCreationAttributes>
  implements Remittance
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  side: RemittanceSide;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: RemittanceType;

  @AllowNull(false)
  @Column(DataType.NUMBER)
  currencyId: Currency['id'];
  currency: Currency;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount: number;

  @AllowNull(true)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('resultAmount')) || null;
    },
  })
  resultAmount?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  status: RemittanceStatus;

  @AllowNull(false)
  @Column(DataType.UUID)
  systemId: string;
  system: System;

  @Column(DataType.UUID)
  providerId?: Provider['id'];

  @Column(DataType.STRING)
  providerName?: Provider['name'];
  provider?: Provider;

  @AllowNull(false)
  @Column(DataType.DATE)
  receiveDate: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  sendDate: Date;

  @Column(DataType.UUID)
  exchangeContractId?: string;
  exchangeContract?: ExchangeContract;

  @Column({
    type: DataType.DECIMAL(16, 4),
    get(): number {
      return parseInt(this.getDataValue('bankQuote')) || null;
    },
  })
  bankQuote?: number;

  @Column({
    type: DataType.DECIMAL(16, 4),
    get(): number {
      return parseFloat(this.getDataValue('iof'));
    },
  })
  iof?: number;

  @Column(DataType.BOOLEAN)
  isConcomitant?: boolean;

  @Column(DataType.STRING)
  sendDateCode?: SettlementDateCode;

  @Column(DataType.STRING)
  receiveDateCode?: SettlementDateCode;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => RemittanceOrderRemittanceModel, { foreignKey: 'remittanceId' })
  remittanceOrdersRemittances?: RemittanceOrderRemittanceModel[];

  constructor(values?: RemittanceCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.currencyId = values?.currencyId ?? values?.currency?.id;
    this.systemId = values?.systemId ?? values?.system?.id;
    this.exchangeContractId =
      values?.exchangeContractId ?? values?.exchangeContract?.id ?? null;
    this.providerId = values?.providerId ?? values?.provider?.id ?? null;
    this.providerName = values?.providerName ?? values?.provider?.name ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Remittance {
    const entity = new RemittanceEntity(this.get({ plain: true }));

    entity.currency = new CurrencyEntity({
      id: this.currencyId,
    });

    entity.system = new SystemEntity({
      id: this.systemId,
    });

    entity.exchangeContract =
      this.exchangeContractId &&
      new ExchangeContractEntity({ id: this.exchangeContractId });

    entity.provider =
      (this.providerId || this.providerName) &&
      new ProviderEntity({ id: this.providerId, name: this.providerName });

    delete entity['currencyId'];
    delete entity['systemId'];
    delete entity['exchangeContractId'];
    delete entity['providerId'];
    delete entity['providerName'];

    return entity;
  }
}
