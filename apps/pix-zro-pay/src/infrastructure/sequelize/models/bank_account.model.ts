import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  AutoIncrement,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  BankAccount,
  BankAccountEntity,
  BankAccountName,
} from '@zro/pix-zro-pay/domain';

type BankAccountAttributes = BankAccount;
type BankAccountCreationAttributes = BankAccountAttributes;

@Table({
  tableName: 'bank_accounts',
  timestamps: true,
  underscored: true,
})
export class BankAccountModel
  extends DatabaseModel<BankAccountAttributes, BankAccountCreationAttributes>
  implements BankAccount
{
  @PrimaryKey
  @AllowNull(false)
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('id'));
    },
  })
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  agency: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  accountNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  cpfCnpj: string;

  @Column({
    type: DataType.STRING,
    field: 'type_chave_pix',
  })
  pixKeyType?: string;

  @Column({
    type: DataType.STRING,
    field: 'chave_pix',
  })
  pixKey?: string;

  @Column({
    type: DataType.STRING,
    field: 'bank_name',
  })
  name?: BankAccountName;

  @Column(DataType.STRING)
  slug?: string;

  @Column(DataType.BOOLEAN)
  refundCpf?: boolean;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(values?: BankAccountAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BankAccount {
    const entity = new BankAccountEntity(this.get({ plain: true }));

    return entity;
  }
}
