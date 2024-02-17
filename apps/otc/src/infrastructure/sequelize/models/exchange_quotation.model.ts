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
  ExchangeQuotation,
  ExchangeQuotationEntity,
  ExchangeQuotationState,
  Provider,
  ProviderEntity,
  System,
  SystemEntity,
} from '@zro/otc/domain';

type ExchangeQuotationAttributes = ExchangeQuotation & {
  providerId?: Provider['id'];
  systemId?: System['id'];
};

type ExchangeQuotationCreationAttributes = ExchangeQuotationAttributes;

@Table({
  tableName: 'exchange_quotations',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class ExchangeQuotationModel
  extends DatabaseModel<
    ExchangeQuotationAttributes,
    ExchangeQuotationCreationAttributes
  >
  implements ExchangeQuotation
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  quotationPspId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  solicitationPspId: string;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('quotation'));
    },
  })
  quotation: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amountExternalCurrency'));
    },
  })
  amountExternalCurrency: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: ExchangeQuotationState;

  @Column(DataType.JSONB)
  props?: { [key: string]: string };

  @AllowNull(false)
  @Column(DataType.STRING)
  gatewayName: string;

  @Column(DataType.UUID)
  providerId?: string;
  provider?: Provider;

  @Column(DataType.UUID)
  systemId?: string;
  system?: System;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  constructor(
    values?: ExchangeQuotationCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.providerId = values?.providerId ?? values?.provider?.id ?? null;
    this.systemId = values?.systemId ?? values?.system?.id ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): ExchangeQuotation {
    const entity = new ExchangeQuotationEntity(this.get({ plain: true }));

    entity.provider =
      this.providerId && new ProviderEntity({ id: this.providerId });
    entity.system = this.systemId && new SystemEntity({ id: this.systemId });

    delete entity['providerId'];
    delete entity['systemId'];

    return entity;
  }
}
