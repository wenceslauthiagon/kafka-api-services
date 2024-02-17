import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  BankingTed,
  BankingTedEntity,
  BankingTedState,
} from '@zro/banking/domain';
import { Operation, OperationEntity } from '@zro/operations/domain';
import { AccountType } from '@zro/pix-payments/domain';
import { User, UserEntity } from '@zro/users/domain';

type BankingTedAttributes = BankingTed & {
  operationId?: string;
  userId?: string;
};
type BankingTedCreationAttributes = BankingTedAttributes;

@Table({
  tableName: 'BankingTeds',
  timestamps: true,
  underscored: true,
})
export class BankingTedModel
  extends DatabaseModel<BankingTedAttributes, BankingTedCreationAttributes>
  implements BankingTed
{
  @PrimaryKey
  @AutoIncrement
  @AllowNull(false)
  @Column(DataType.INTEGER)
  id?: number;

  @Column(DataType.UUID)
  transactionId?: string;

  @Column(DataType.UUID)
  userId?: string;
  user?: User;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;
  operation: Operation;

  @Column(DataType.STRING)
  state?: BankingTedState;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount')) || null;
    },
  })
  amount?: number;

  @AllowNull(false)
  @Column({
    type: DataType.STRING,
    field: 'beneficiary_bank_id',
  })
  beneficiaryBankCode: string;

  @Column(DataType.STRING)
  beneficiaryBankName?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryType: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryDocument: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryAgency: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryAccount: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryAccountDigit: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryAccountType: AccountType;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  @Column(DataType.DATE)
  confirmedAt?: Date;

  @Column(DataType.DATE)
  failedAt?: Date;

  @Column(DataType.DATE)
  forwardedAt?: Date;

  constructor(values?: BankingTedCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.userId = values?.userId ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): BankingTed {
    const entity = new BankingTedEntity(this.get({ plain: true }));
    entity.operation = new OperationEntity({
      id: this.operationId,
    });
    entity.user =
      this.userId &&
      new UserEntity({
        uuid: this.userId,
      });
    return entity;
  }

  isAlreadyForwardedBankingTed(): boolean {
    return this.toDomain().isAlreadyForwardedBankingTed();
  }

  isAlreadyFailedBankingTed(): boolean {
    return this.toDomain().isAlreadyFailedBankingTed();
  }

  isAlreadyPaidBankingTed(): boolean {
    return this.toDomain().isAlreadyPaidBankingTed();
  }

  isAlreadyConfirmedBankingTed(): boolean {
    return this.toDomain().isAlreadyConfirmedBankingTed();
  }

  hasReceipt(): boolean {
    return this.toDomain().hasReceipt();
  }
}
