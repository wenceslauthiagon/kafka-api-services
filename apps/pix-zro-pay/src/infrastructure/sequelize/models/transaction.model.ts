import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
  Default,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  Transaction,
  BankAccount,
  TransactionEntity,
  BankAccountEntity,
  Client,
  Company,
  CompanyEntity,
  ClientEntity,
  TransactionType,
  TransactionStatus,
  TransactionProcessStatus,
  TransactionPaymentType,
} from '@zro/pix-zro-pay/domain';

type TransactionAttributes = Transaction & {
  companyId: number;
  clientId?: number;
  bankId?: number;
};
type TransactionCreationAttributes = TransactionAttributes;

@Table({
  tableName: 'transactions',
  timestamps: true,
  underscored: true,
})
export class TransactionModel
  extends DatabaseModel<TransactionAttributes, TransactionCreationAttributes>
  implements Transaction
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
  id?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  paymentType: TransactionPaymentType;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  valueCents: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  feeValue: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  feeInPercent: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('clientId')) || null;
    },
  })
  clientId?: number;
  client?: Client;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('companyId'));
    },
  })
  companyId: number;
  company: Company;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('bankId')) || null;
    },
  })
  bankId?: number;
  bankAccount?: BankAccount;

  @AllowNull(false)
  @Column(DataType.UUID)
  uuid: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  status: TransactionStatus;

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

  @AllowNull(false)
  @Column(DataType.STRING)
  transactionType: TransactionType;

  @Column(DataType.STRING)
  description?: string;

  @Column(DataType.STRING)
  instantPaymentIdField?: string;

  @Column(DataType.STRING)
  transactionOrigin: string;

  @Column(DataType.TEXT)
  errorDescription?: string;

  @Column(DataType.STRING)
  bankReference?: string;

  @Column(DataType.STRING)
  referenceId?: string;

  @Column(DataType.DATE)
  paymentDate?: Date;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  isManual: boolean;

  @Column(DataType.STRING)
  endToEndIdField?: string;

  @Column(DataType.BOOLEAN)
  warning?: boolean;

  @Column(DataType.INTEGER)
  oldValueCents?: number;

  @Column(DataType.STRING)
  merchantId?: string;

  @Column(DataType.STRING)
  pspIspb?: string;

  @Column(DataType.STRING)
  pspBankName?: string;

  @Column(DataType.FLOAT)
  totalFee?: number;

  @Column(DataType.INTEGER)
  mainCompanyTotalFeeCents?: number;

  @Column(DataType.STRING)
  processStatus?: TransactionProcessStatus;

  @Column(DataType.INTEGER)
  zroTotalValueInCents?: number;

  @Column(DataType.BOOLEAN)
  isTransferredToMainCompany?: boolean;

  @Column(DataType.STRING)
  p2pId?: string;

  @Column(DataType.STRING)
  p2pOperationId?: string;

  @Column(DataType.STRING)
  paidBy?: string;

  @Column(DataType.STRING)
  p2pErrorDescription?: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('paidByClientId')) || null;
    },
  })
  paidByClientId?: number;

  @Column(DataType.BOOLEAN)
  isManualRefund?: boolean;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  constructor(values?: TransactionAttributes, options?: BuildOptions) {
    super(values, options);
    this.companyId = values?.companyId ?? values?.company?.id;
    this.clientId = values?.clientId ?? values?.client?.id;
    this.bankId = values?.bankId ?? values?.bankAccount?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Transaction {
    const entity = new TransactionEntity(this.get({ plain: true }));
    entity.company = new CompanyEntity({ id: this.companyId });
    entity.client = this.clientId && new ClientEntity({ id: this.clientId });
    entity.bankAccount =
      this.bankId && new BankAccountEntity({ id: this.bankId });

    delete entity['companyId'];
    delete entity['clientId'];
    delete entity['bankId'];

    return entity;
  }
}
