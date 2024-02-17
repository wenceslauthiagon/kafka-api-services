import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Min,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { StreamPair, StreamPairEntity } from '@zro/quotations/domain';
import { Currency, CurrencyEntity } from '@zro/operations/domain';

export type StreamPairAttributes = StreamPair & {
  baseCurrencyId: Currency['id'];
  quoteCurrencyId: Currency['id'];
  composedByIds?: string;
};
export type StreamPairCreationAttributes = StreamPairAttributes;

@Table({
  tableName: 'stream_pairs',
  timestamps: true,
  underscored: true,
})
export class StreamPairModel
  extends Model<StreamPairAttributes, StreamPairCreationAttributes>
  implements StreamPair
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  baseCurrencyId: Currency['id'];
  baseCurrency: Currency;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  quoteCurrencyId: Currency['id'];
  quoteCurrency: Currency;

  @AllowNull(false)
  @Min(0)
  @Column(DataType.INTEGER)
  priority: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  gatewayName: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  active: boolean;

  @Column(DataType.STRING)
  composedByIds?: string;
  composedBy?: StreamPair[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: StreamPairCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.baseCurrencyId = values?.baseCurrencyId ?? values?.baseCurrency?.id;
    this.quoteCurrencyId = values?.quoteCurrencyId ?? values?.quoteCurrency?.id;
    this.composedByIds =
      values?.composedByIds ??
      values?.composedBy?.map((pair) => pair.id).join(',');
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): StreamPair {
    const entity = new StreamPairEntity(this.get({ plain: true }));
    entity.baseCurrency = new CurrencyEntity({ id: this.baseCurrencyId });
    entity.quoteCurrency = new CurrencyEntity({ id: this.quoteCurrencyId });

    if (this.composedByIds) {
      entity.composedBy = this.composedByIds
        .split(',')
        .map((id) => new StreamPairEntity({ id: id.trim() }));
    }

    delete entity['baseCurrencyId'];
    delete entity['quoteCurrencyId'];
    delete entity['composedByIds'];

    return entity;
  }

  isSynthetic(): boolean {
    return this.toDomain().isSynthetic();
  }
}
