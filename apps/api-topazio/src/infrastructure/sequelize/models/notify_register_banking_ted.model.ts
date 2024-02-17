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
  NotifyRegisterBankingTed,
  NotifyRegisterBankingTedEntity,
  NotifyRegisterBankingTedStatus,
  NotifyStateType,
} from '@zro/api-topazio/domain';

type NotifyRegisterBankingTedAttributes = NotifyRegisterBankingTed;
type NotifyRegisterBankingTedCreationAttributes =
  NotifyRegisterBankingTedAttributes;

@Table({
  tableName: 'topazio_notify_register_banking_teds',
  timestamps: true,
  underscored: true,
})
export class NotifyRegisterBankingTedModel
  extends DatabaseModel<
    NotifyRegisterBankingTedAttributes,
    NotifyRegisterBankingTedCreationAttributes
  >
  implements NotifyRegisterBankingTed
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
  status: NotifyRegisterBankingTedStatus;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: NotifyStateType;

  @Column(DataType.STRING)
  code?: string;

  @Column(DataType.STRING)
  message?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyRegisterBankingTedCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyRegisterBankingTed {
    const entity = new NotifyRegisterBankingTedEntity(
      this.get({ plain: true }),
    );
    return entity;
  }
}
