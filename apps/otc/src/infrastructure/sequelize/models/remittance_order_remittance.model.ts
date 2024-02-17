import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  Default,
  createIndexDecorator,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  RemittanceOrderRemittance,
  RemittanceOrderRemittanceEntity,
  RemittanceOrder,
  Remittance,
  RemittanceOrderEntity,
  RemittanceEntity,
} from '@zro/otc/domain';
import { RemittanceModel } from './remittance.model';
import { RemittanceOrderModel } from './remittance_order.model';

type RemittanceOrderRemittanceAttributes = RemittanceOrderRemittance & {
  remittanceOrderId: string;
  remittanceId: string;
};
type RemittanceOrderRemittanceCreationAttributes =
  RemittanceOrderRemittanceAttributes;

const TagUnique = createIndexDecorator({
  name: 'remittance_orders_remittances_both_id_key',
  unique: true,
});

@Table({
  tableName: 'remittance_orders_remittances',
  timestamps: true,
  underscored: true,
})
export class RemittanceOrderRemittanceModel
  extends DatabaseModel<
    RemittanceOrderRemittanceAttributes,
    RemittanceOrderRemittanceCreationAttributes
  >
  implements RemittanceOrderRemittance
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => RemittanceOrderModel)
  @AllowNull(false)
  @TagUnique
  @Column(DataType.UUID)
  remittanceOrderId!: RemittanceOrder['id'];

  @BelongsTo(() => RemittanceOrderModel, { targetKey: 'id' })
  remittanceOrder!: RemittanceOrderModel;

  @ForeignKey(() => RemittanceModel)
  @AllowNull(false)
  @TagUnique
  @Column(DataType.UUID)
  remittanceId!: Remittance['id'];

  @BelongsTo(() => RemittanceModel, { targetKey: 'id' })
  remittance!: RemittanceModel;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: RemittanceOrderRemittanceCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);

    this.remittanceOrderId =
      values?.remittanceOrderId ?? values?.remittanceOrder?.id;
    this.remittanceId = values?.remittanceId ?? values?.remittance?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): RemittanceOrderRemittance {
    const entity = new RemittanceOrderRemittanceEntity(
      this.get({ plain: true }),
    );

    if (this.remittanceOrder) {
      entity.remittanceOrder = this.remittanceOrder.toDomain();
    } else if (this.remittanceOrderId) {
      entity.remittanceOrder = new RemittanceOrderEntity({
        id: this.remittanceOrderId,
      });
    }

    if (this.remittance) {
      entity.remittance = this.remittance.toDomain();
    } else if (this.remittanceId) {
      entity.remittance = new RemittanceEntity({
        id: this.remittanceId,
      });
    }

    delete entity['remittanceOrderId'];
    delete entity['remittanceId'];

    return entity;
  }
}
