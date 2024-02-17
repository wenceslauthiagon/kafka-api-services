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
  Company,
  CompanyEntity,
  CashOutSolicitation,
  TransactionType,
  CashOutSolicitationEntity,
  BankAccount,
  BankAccountEntity,
  CashOutSolicitationStatus,
} from '@zro/pix-zro-pay/domain';

type CashOutSolicitationAttributes = CashOutSolicitation & {
  companyId: number;
  bankAccountId: number;
};
type CashOutSolicitationCreationAttributes = CashOutSolicitationAttributes;

@Table({
  tableName: 'cash_out_solicitations',
  timestamps: true,
  underscored: true,
})
export class CashOutSolicitationModel
  extends DatabaseModel<
    CashOutSolicitationAttributes,
    CashOutSolicitationCreationAttributes
  >
  implements CashOutSolicitation
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
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('companyId'));
    },
  })
  companyId: number;
  company: Company;

  @AllowNull(false)
  @Column(DataType.STRING)
  financialEmail: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('bankAccountId')) || null;
    },
  })
  bankAccountId?: number;
  bankAccount?: BankAccount;

  @AllowNull(false)
  @Column(DataType.NUMBER)
  valueCents: number;

  @Column(DataType.DATE)
  paymentDate: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  status: CashOutSolicitationStatus;

  @Column(DataType.STRING)
  responsibleUserObservation: string;

  @Column(DataType.STRING)
  requesterUserObservation: string;

  @Column(DataType.NUMBER)
  responsibleUserId: number;

  @AllowNull(false)
  @Column(DataType.NUMBER)
  requesterUserId: number;

  @Column(DataType.STRING)
  providerHolderName: string;

  @Column(DataType.STRING)
  providerHolderCnpj: string;

  @Column(DataType.STRING)
  providerBankName: string;

  @Column(DataType.STRING)
  providerBankBranch: string;

  @Column(DataType.STRING)
  providerBankAccountNumber: string;

  @Column(DataType.STRING)
  providerBankIspb: string;

  @Column(DataType.STRING)
  providerBankAccountType: string;

  @Column(DataType.STRING)
  errorDescription: string;

  @Column(DataType.STRING)
  endToEndId: string;

  @Column(DataType.STRING)
  transactionType: TransactionType;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  constructor(values?: CashOutSolicitationAttributes, options?: BuildOptions) {
    super(values, options);
    this.companyId = values?.companyId ?? values?.company?.id;
    this.bankAccountId = values?.bankAccountId ?? values?.bankAccount?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): CashOutSolicitation {
    const entity = new CashOutSolicitationEntity(this.get({ plain: true }));
    entity.company = new CompanyEntity({ id: this.companyId });
    entity.bankAccount = new BankAccountEntity({ id: this.bankAccountId });

    delete entity['companyId'];
    delete entity['bankAccountId'];
    return entity;
  }
}
