import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  BelongsTo,
  ForeignKey,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';
import { Cashback, CashbackEntity, ConversionEntity } from '@zro/otc/domain';
import { ConversionModel } from './conversion.model';

type CashbackAttributes = Cashback & {
  userId?: string;
  conversionId?: string;
  currencyId?: number;
};
type CashbackCreationAttributes = CashbackAttributes;

@Table({
  tableName: 'cashbacks',
  timestamps: true,
  underscored: true,
})
export class CashbackModel
  extends DatabaseModel<CashbackAttributes, CashbackCreationAttributes>
  implements Cashback
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;
  user: User;

  @ForeignKey(() => ConversionModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  conversionId: string;

  @BelongsTo(() => ConversionModel)
  conversion: ConversionModel;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  currencyId: number;
  currency: Currency;

  @Column(DataType.STRING)
  description?: string;

  @Column(DataType.STRING)
  issuedBy?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: CashbackCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.conversionId = values?.conversionId ?? values?.conversion?.id;
    this.currencyId = values?.currencyId ?? values?.currency?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Cashback {
    const entity = new CashbackEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    entity.currency = new CurrencyEntity({ id: this.currencyId });

    // The conversion exists if the cashbackRepository includes the conversionModel in the query,
    // otherwise, only the conversionId exists.
    if (this.conversion) {
      entity.conversion = this.conversion.toDomain();
    } else if (this.conversionId) {
      entity.conversion = new ConversionEntity({ id: this.conversionId });
    }

    return entity;
  }
}
