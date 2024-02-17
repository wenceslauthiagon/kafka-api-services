import {
  Table,
  Column,
  DataType,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  BankingAccountContact,
  BankingAccountContactEntity,
  BankingContact,
  BankingContactEntity,
} from '@zro/banking/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { BankingContactModel } from '@zro/banking/infrastructure';

type BankingAccountContactAttributes = BankingAccountContact & {
  bankingContactId: number;
};
type BankingAccountContactCreationAttributes = BankingAccountContactAttributes;

@Table({
  tableName: 'BankingAccountContacts',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class BankingAccountContactModel
  extends DatabaseModel<
    BankingAccountContactAttributes,
    BankingAccountContactCreationAttributes
  >
  implements BankingAccountContact
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  @ForeignKey(() => BankingContactModel)
  bankingContactId: number;

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
  branchNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  accountNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  accountDigit: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  bankName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  bankCode: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  deletedAt: Date;

  @BelongsTo(() => BankingContactModel)
  bankingContact: BankingContact;

  constructor(
    values?: BankingAccountContactCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.bankingContactId =
      values?.bankingContactId ?? values?.bankingContact?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BankingAccountContact {
    const entity = new BankingAccountContactEntity(this.get({ plain: true }));
    entity.bankingContact = new BankingContactEntity({
      id: this.bankingContactId,
    });

    delete entity['bankingContactId'];

    return entity;
  }
}
