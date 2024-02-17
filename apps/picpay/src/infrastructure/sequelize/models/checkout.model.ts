import { DatabaseModel } from '@zro/common';
import { Checkout, CheckoutEntity } from '@zro/picpay/domain';
import {
  Column,
  Table,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { CheckoutHistoricModel } from './checkout_historic.model';
import { BuildOptions } from 'sequelize';

type CheckoutAttributes = Checkout;
type CheckoutCreationAttributes = CheckoutAttributes;

@Table({ tableName: 'checkouts_picpay', timestamps: true, underscored: true })
export class CheckoutModel
  extends DatabaseModel<CheckoutAttributes, CheckoutCreationAttributes>
  implements Checkout
{
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  status: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  referenceId: string;

  @Column({
    type: DataType.STRING(80),
    allowNull: true,
  })
  authorizationId: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  destination: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  requesterName: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  requesterDocument: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  requesterContact: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  payload: string;

  @Column({
    type: DataType.DECIMAL(10, 2),
    allowNull: false,
    get(): number {
      return Number(this.getDataValue('amount'));
    },
  })
  amount: number;

  @Column({
    type: DataType.STRING(3),
    allowNull: true,
  })
  currency: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  expiresAt: Date;

  @HasMany(() => CheckoutHistoricModel)
  historic?: CheckoutHistoricModel[];

  constructor(values?: CheckoutCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Checkout {
    const entity = new CheckoutEntity(this.get({ plain: true }));
    return entity;
  }
}
