import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
  createIndexDecorator,
} from 'sequelize-typescript';
import {
  ExchangeQuotation,
  ExchangeQuotationEntity,
  Remittance,
  RemittanceEntity,
  RemittanceExchangeQuotation,
  RemittanceExchangeQuotationEntity,
} from '@zro/otc/domain';
import {
  RemittanceModel,
  ExchangeQuotationModel,
} from '@zro/otc/infrastructure';

export type RemittanceExchangeQuotationAttributes =
  RemittanceExchangeQuotation & {
    remittanceId: Remittance['id'];
    exchangeQuotationId: ExchangeQuotation['id'];
  };
export type RemittanceExchangeQuotationCreationAttributes =
  RemittanceExchangeQuotationAttributes;

const TagUnique = createIndexDecorator({
  name: 'remittance_exchange_quotation_both_id_key',
  unique: true,
});

@Table({
  tableName: 'remittance_exchange_quotations',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class RemittanceExchangeQuotationModel
  extends Model<
    RemittanceExchangeQuotationAttributes,
    RemittanceExchangeQuotationCreationAttributes
  >
  implements RemittanceExchangeQuotation
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => RemittanceModel)
  @AllowNull(false)
  @TagUnique
  @Column(DataType.UUID)
  remittanceId!: Remittance['id'];

  @BelongsTo(() => RemittanceModel, { targetKey: 'id' })
  remittance!: RemittanceModel;

  @ForeignKey(() => ExchangeQuotationModel)
  @AllowNull(false)
  @TagUnique
  @Column(DataType.UUID)
  exchangeQuotationId!: ExchangeQuotation['id'];

  @BelongsTo(() => ExchangeQuotationModel, { targetKey: 'id' })
  exchangeQuotation!: ExchangeQuotationModel;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(
    values?: RemittanceExchangeQuotationCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.remittanceId = values?.remittanceId ?? values?.remittance?.id;
    this.exchangeQuotationId =
      values?.exchangeQuotationId ?? values?.exchangeQuotation?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): RemittanceExchangeQuotation {
    const entity = new RemittanceExchangeQuotationEntity(
      this.get({ plain: true }),
    );

    if (this.remittance) {
      entity.remittance = this.remittance.toDomain();
    } else if (this.remittanceId) {
      entity.remittance = new RemittanceEntity({
        id: this.remittanceId,
      });
    }

    if (this.exchangeQuotation) {
      entity.exchangeQuotation = this.exchangeQuotation.toDomain();
    } else if (this.exchangeQuotationId) {
      entity.exchangeQuotation = new ExchangeQuotationEntity({
        id: this.exchangeQuotationId,
      });
    }

    delete entity['remittanceId'];
    delete entity['exchangeQuotationId'];

    return entity;
  }
}
