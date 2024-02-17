import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  Default,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  RemittanceExposureRule,
  RemittanceExposureRuleEntity,
  SettlementDateRule,
} from '@zro/otc/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';

type RemittanceExposureRuleAttributes = RemittanceExposureRule & {
  currencyId?: Currency['id'];
  currencySymbol?: Currency['symbol'];
};

type RemittanceExposureRuleCreationAttributes =
  RemittanceExposureRuleAttributes;

@Table({
  tableName: 'remittance_exposure_rules',
  timestamps: true,
  underscored: true,
})
export class RemittanceExposureRuleModel
  extends DatabaseModel<
    RemittanceExposureRuleAttributes,
    RemittanceExposureRuleCreationAttributes
  >
  implements RemittanceExposureRule
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.NUMBER)
  currencyId: number;
  @AllowNull(false)
  @Column(DataType.STRING)
  currencySymbol: string;
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
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('seconds'));
    },
  })
  seconds: number;

  @Column(DataType.ARRAY(DataType.JSONB))
  settlementDateRules?: SettlementDateRule[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: RemittanceExposureRuleCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.currencyId = values?.currencyId ?? values?.currency?.id;
    this.currencySymbol = values?.currencySymbol ?? values?.currency?.symbol;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): RemittanceExposureRule {
    const entity = new RemittanceExposureRuleEntity(this.get({ plain: true }));

    entity.currency = new CurrencyEntity({
      id: this.currencyId,
      symbol: this.currencySymbol,
    });

    delete entity['currencyId'];
    delete entity['currencySymbol'];

    return entity;
  }
}
