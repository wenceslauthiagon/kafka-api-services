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
import {
  NotifyConfirmBankingTed,
  NotifyConfirmBankingTedEntity,
  NotifyStateType,
} from '@zro/api-topazio/domain';
import { AccountType } from '@zro/pix-payments/domain';

type NotifyConfirmBankingTedAttributes = NotifyConfirmBankingTed;
type NotifyConfirmBankingTedCreationAttributes =
  NotifyConfirmBankingTedAttributes;

@Table({
  tableName: 'topazio_notify_confirm_banking_teds',
  timestamps: true,
  underscored: true,
})
export class NotifyConfirmBankingTedModel
  extends DatabaseModel<
    NotifyConfirmBankingTedAttributes,
    NotifyConfirmBankingTedCreationAttributes
  >
  implements NotifyConfirmBankingTed
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  transactionId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: NotifyStateType;

  @AllowNull(false)
  @Column(DataType.STRING)
  document: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  bankCode: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  branch: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  accountNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  accountType: AccountType;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('value'));
    },
  })
  value: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyConfirmBankingTedCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyConfirmBankingTed {
    const entity = new NotifyConfirmBankingTedEntity(this.get({ plain: true }));
    return entity;
  }
}
