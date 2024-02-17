import {
  Column,
  DataType,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';

import { DatabaseModel } from '@zro/common';
import { User, UserEntity, PersonType } from '@zro/users/domain';
import {
  AccountType,
  DecodedPixAccount,
  DecodedPixAccountEntity,
  DecodedPixAccountState,
} from '@zro/pix-payments/domain';
import { Bank, BankEntity } from '@zro/banking/domain';

type PixDecodedAccountAtUsertributes = DecodedPixAccount & {
  userId: User['uuid'];
  bankIspb: Bank['ispb'];
  bankName: Bank['name'];
};
type PixDecodedAccountCreationAttributes = PixDecodedAccountAtUsertributes;

@Table({
  tableName: 'pix_decoded_account',
  timestamps: true,
  underscored: true,
})
export class DecodedPixAccountModel
  extends DatabaseModel<
    PixDecodedAccountAtUsertributes,
    PixDecodedAccountCreationAttributes
  >
  implements DecodedPixAccount
{
  @PrimaryKey
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.UUID)
  userId: string;

  user: User;

  @Column(DataType.JSONB)
  props?: any;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  tradeName?: string;

  @Column(DataType.STRING)
  bankIspb: string;

  @Column(DataType.STRING)
  bankName: string;

  bank: Bank;

  @Column(DataType.STRING)
  branch: string;

  @Column(DataType.STRING)
  accountNumber: string;

  @Column(DataType.STRING)
  document: string;

  @Column(DataType.STRING)
  state: DecodedPixAccountState;

  @Column(DataType.STRING)
  personType: PersonType;

  @Column(DataType.STRING)
  accountType: AccountType;

  @Column(DataType.DATE)
  createdAt: Date;

  @Column(DataType.DATE)
  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: PixDecodedAccountCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);

    this.userId = values?.userId ?? values?.user?.uuid;
    this.bankIspb = values?.bankIspb ?? values?.bank?.ispb;
    this.bankName = values?.bankName ?? values?.bank?.name;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): DecodedPixAccount {
    const entity = new DecodedPixAccountEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    entity.bank = new BankEntity({ name: this.bankName, ispb: this.bankIspb });

    delete entity['userId'];
    delete entity['bankName'];
    delete entity['bankIspb'];

    return entity;
  }
}
