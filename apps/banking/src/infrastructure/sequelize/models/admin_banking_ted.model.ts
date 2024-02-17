import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  AdminBankingTed,
  AdminBankingTedEntity,
  AdminBankingTedState,
  AdminBankingAccount,
  AdminBankingAccountEntity,
} from '@zro/banking/domain';
import { Admin, AdminEntity } from '@zro/admin/domain';

type AdminBankingTedAttributes = AdminBankingTed & {
  sourceId: string;
  destinationId: string;
  createdBy: number;
  updatedBy: number;
};
type AdminBankingTedCreationAttributes = AdminBankingTedAttributes;

@Table({
  tableName: 'AdminBankingTransfers',
  timestamps: true,
  underscored: true,
})
export class AdminBankingTedModel
  extends DatabaseModel<
    AdminBankingTedAttributes,
    AdminBankingTedCreationAttributes
  >
  implements AdminBankingTed
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  sourceId: string;
  source: AdminBankingAccount;

  @AllowNull(false)
  @Column(DataType.STRING)
  destinationId: string;
  destination: AdminBankingAccount;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: AdminBankingTedState;

  @AllowNull(false)
  @Column(DataType.STRING)
  description: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  value: number;

  @Column(DataType.STRING)
  transactionId?: string;

  @Column(DataType.STRING)
  failureCode?: string;

  @Column(DataType.STRING)
  failureMessage?: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  createdBy: number;
  createdByAdmin: Admin;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  updatedBy: number;
  updatedByAdmin: Admin;

  @Column(DataType.DATE)
  confirmedAt?: Date;

  @Column(DataType.DATE)
  failedAt?: Date;

  @Column(DataType.DATE)
  forwardedAt?: Date;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  constructor(
    values?: AdminBankingTedCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.sourceId = values?.sourceId ?? values?.source?.id;
    this.destinationId = values?.destinationId ?? values?.destination?.id;
    this.createdBy = values?.createdBy ?? values?.createdByAdmin?.id;
    this.updatedBy = values?.updatedBy ?? values?.updatedByAdmin?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): AdminBankingTed {
    const entity = new AdminBankingTedEntity(this.get({ plain: true }));
    entity.source = new AdminBankingAccountEntity({
      id: this.sourceId,
    });
    entity.destination = new AdminBankingAccountEntity({
      id: this.destinationId,
    });
    entity.createdByAdmin = new AdminEntity({
      id: this.createdBy,
    });
    entity.updatedByAdmin = new AdminEntity({
      id: this.updatedBy,
    });

    return entity;
  }

  isAlreadyForwardedAdminBankingTed(): boolean {
    return this.toDomain().isAlreadyForwardedAdminBankingTed();
  }

  isAlreadyFailedAdminBankingTed(): boolean {
    return this.toDomain().isAlreadyFailedAdminBankingTed();
  }

  isAlreadyPaidAdminBankingTed(): boolean {
    return this.toDomain().isAlreadyPaidAdminBankingTed();
  }

  isAlreadyConfirmedAdminBankingTed(): boolean {
    return this.toDomain().isAlreadyConfirmedAdminBankingTed();
  }
}
