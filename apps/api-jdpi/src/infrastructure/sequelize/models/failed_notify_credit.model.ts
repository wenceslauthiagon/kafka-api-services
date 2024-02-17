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
import { DatabaseModel, Failed, FailedEntity } from '@zro/common';
import {
  FailedNotifyCredit,
  FailedNotifyCreditEntity,
  NotifyCreditTransactionType,
} from '@zro/api-jdpi/domain';

type FailedNotifyCreditAttributes = FailedNotifyCredit & {
  failedCode?: string;
  failedMessage?: string;
};
type FailedNotifyCreditCreationAttributes = FailedNotifyCreditAttributes;

@Table({
  tableName: 'jdpi_failed_notify_credits',
  timestamps: true,
  underscored: true,
})
export class FailedNotifyCreditModel
  extends DatabaseModel<
    FailedNotifyCreditAttributes,
    FailedNotifyCreditCreationAttributes
  >
  implements FailedNotifyCredit
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  externalId!: string;

  @Column(DataType.STRING)
  failedMessage?: string;

  @Column(DataType.STRING)
  failedCode?: string;
  failed: Failed;

  @AllowNull(false)
  @Column(DataType.STRING)
  failedTransactionType: NotifyCreditTransactionType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: FailedNotifyCreditCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.failedCode = values?.failedCode ?? values?.failed?.code ?? null;
    this.failedMessage =
      values?.failedMessage ?? values?.failed?.message ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): FailedNotifyCredit {
    const entity = new FailedNotifyCreditEntity(this.get({ plain: true }));
    entity.failed =
      this.failedCode &&
      this.failedMessage &&
      new FailedEntity({
        code: this.failedCode,
        message: this.failedMessage,
      });

    delete entity['failedCode'];
    delete entity['failedMessage'];

    return entity;
  }
}
