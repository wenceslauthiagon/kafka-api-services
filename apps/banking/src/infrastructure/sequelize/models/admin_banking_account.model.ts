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
  AdminBankingAccount,
  AdminBankingAccountEntity,
} from '@zro/banking/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { Admin, AdminEntity } from '@zro/admin/domain';

type AdminBankingAccountAttributes = AdminBankingAccount & {
  createdBy: number;
  updatedBy: number;
};
type AdminBankingAccountCreationAttributes = AdminBankingAccountAttributes;

@Table({
  tableName: 'AdminBankingAccounts',
  timestamps: true,
  underscored: true,
})
export class AdminBankingAccountModel
  extends DatabaseModel<
    AdminBankingAccountAttributes,
    AdminBankingAccountCreationAttributes
  >
  implements AdminBankingAccount
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  document: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  fullName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  branchNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  accountNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  accountDigit: string;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    get(): string {
      return this.getDataValue('accountType').toUpperCase();
    },
  })
  accountType: AccountType;

  @AllowNull(false)
  @Column(DataType.STRING)
  bankName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  bankCode: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  description: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  enabled: boolean;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  createdBy: number;
  createdByAdmin: Admin;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  updatedBy: number;
  updatedByAdmin: Admin;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  constructor(
    values?: AdminBankingAccountCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.createdBy = values?.createdBy ?? values?.createdByAdmin?.id;
    this.updatedBy = values?.updatedBy ?? values?.updatedByAdmin?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): AdminBankingAccount {
    const entity = new AdminBankingAccountEntity(this.get({ plain: true }));
    entity.createdByAdmin = new AdminEntity({
      id: this.createdBy,
    });
    entity.updatedByAdmin = new AdminEntity({
      id: this.updatedBy,
    });

    return entity;
  }

  isActive(): boolean {
    return this.toDomain().isActive();
  }
}
