import { DatabaseModel } from '@zro/common';
import {
  Checkout,
  CheckoutHistoric,
  CheckoutHistoricEntity,
} from '@zro/nupay/domain';
import {
  Column,
  Table,
  DataType,
  ForeignKey,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { CheckoutModel } from './checkout.model';
import { BuildOptions } from 'sequelize';

type CheckoutHistoricAttributes = CheckoutHistoric & {
  checkoutId: Checkout['id'];
};

type CheckoutHistoricCreationAttributes = CheckoutHistoricAttributes;

@Table({
  tableName: 'checkout_historics_nupay',
  timestamps: true,
  underscored: true,
})
export class CheckoutHistoricModel
  extends DatabaseModel<
    CheckoutHistoricAttributes,
    CheckoutHistoricCreationAttributes
  >
  implements CheckoutHistoric
{
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @ForeignKey(() => CheckoutModel)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  checkoutId: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  currentStatus: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  previousStatus: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  action: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  response: any;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: CheckoutHistoricCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);

    this.checkoutId = values?.checkoutId;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): CheckoutHistoric {
    const entity = new CheckoutHistoricEntity(this.get({ plain: true }));
    return entity;
  }
}
