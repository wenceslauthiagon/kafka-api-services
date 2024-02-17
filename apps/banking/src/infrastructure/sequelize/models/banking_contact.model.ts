import {
  Table,
  Column,
  DataType,
  CreatedAt,
  UpdatedAt,
  AllowNull,
  PrimaryKey,
  AutoIncrement,
  HasMany,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { BankingContact, BankingContactEntity } from '@zro/banking/domain';
import { PersonDocumentType, User, UserEntity } from '@zro/users/domain';
import { BankingAccountContactModel } from '@zro/banking/infrastructure';

type BankingContactAttributes = BankingContact & {
  userId?: number;
  contactUserId?: number;
};
type BankingContactCreationAttributes = BankingContactAttributes;

@Table({
  tableName: 'BankingContacts',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class BankingContactModel
  extends DatabaseModel<
    BankingContactAttributes,
    BankingContactCreationAttributes
  >
  implements BankingContact
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  userId: number;
  user: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  documentType: PersonDocumentType;

  @AllowNull(false)
  @Column(DataType.STRING)
  document: string;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.INTEGER,
    field: 'zro_id',
  })
  contactUserId: number;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  deletedAt: Date;

  contactUser?: User;

  @HasMany(() => BankingAccountContactModel)
  accounts: BankingAccountContactModel[];

  constructor(
    values?: BankingContactCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.id;
    this.contactUserId = values?.contactUserId ?? values?.contactUser?.id ?? 0;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BankingContact {
    const entity = new BankingContactEntity(this.get({ plain: true }));
    entity.user = new UserEntity({
      id: this.userId,
    });

    if (this.contactUserId) {
      entity.contactUser = new UserEntity({
        id: this.contactUserId,
      });
    }

    if (this.accounts) {
      entity.accounts = this.accounts.map((account) => account.toDomain());
    }

    delete entity['userId'];
    delete entity['contactUserId'];

    return entity;
  }
}
