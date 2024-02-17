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
import { DatabaseModel } from '@zro/common';
import { Bank, BankEntity } from '@zro/banking/domain';
import { User, UserEntity, PersonDocumentType } from '@zro/users/domain';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  AccountType,
  Payment,
  PaymentEntity,
  PixDevolutionReceived,
  PixDevolutionReceivedEntity,
  PixDevolutionReceivedState,
} from '@zro/pix-payments/domain';

type PixDevolutionReceivedAttributes = PixDevolutionReceived & {
  userId?: string;
  walletId?: string;
  operationId?: string;
  clientBankIspb?: string;
  clientBankName?: string;
  thirdPartBankIspb?: string;
  thirdPartBankName?: string;
  transactionOriginalId?: string;
};
type PixDevolutionReceivedCreationAttributes = PixDevolutionReceivedAttributes;

@Table({
  tableName: 'pix_devolutions_received',
  timestamps: true,
  underscored: true,
})
export class PixDevolutionReceivedModel
  extends DatabaseModel<
    PixDevolutionReceivedAttributes,
    PixDevolutionReceivedCreationAttributes
  >
  implements PixDevolutionReceived
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user!: User;

  @AllowNull(false)
  @Column(DataType.UUID)
  walletId!: string;
  wallet: Wallet;

  @AllowNull(false)
  @Column(DataType.UUID)
  operationId!: string;
  operation!: Operation;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: PixDevolutionReceivedState;

  @Column({
    type: DataType.STRING,
    field: 'txid',
  })
  txId: string;

  @AllowNull(true)
  @Column(DataType.UUID)
  transactionOriginalId?: string;
  payment: Payment;

  @Column(DataType.STRING)
  endToEndId: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount!: number;

  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('returnedAmount'));
    },
  })
  returnedAmount!: number;

  @Column(DataType.STRING)
  clientBankIspb: string;

  @Column(DataType.STRING)
  clientBankName: string;

  @Column(DataType.STRING)
  clientBranch: string;

  @Column(DataType.STRING)
  clientAccountNumber: string;

  @Column(DataType.STRING)
  clientPersonType: PersonDocumentType;

  @Column(DataType.STRING)
  clientDocument: string;

  @Column(DataType.STRING)
  clientName: string;

  @Column(DataType.STRING)
  clientKey: string;

  @Column(DataType.STRING)
  thirdPartBankIspb: string;

  @Column(DataType.STRING)
  thirdPartBankName: string;

  @Column(DataType.STRING)
  thirdPartBranch: string;

  @Column(DataType.STRING)
  thirdPartAccountType: AccountType;

  @Column(DataType.STRING)
  thirdPartAccountNumber: string;

  @Column(DataType.STRING)
  thirdPartPersonType: PersonDocumentType;

  @Column(DataType.STRING)
  thirdPartDocument: string;

  @Column(DataType.STRING)
  thirdPartName: string;

  @Column(DataType.STRING)
  thirdPartKey: string;

  @Column(DataType.STRING)
  description: string;

  @Column(DataType.STRING)
  transactionTag: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  clientBank: Bank;
  thirdPartBank: Bank;

  constructor(
    values?: PixDevolutionReceivedAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.walletId = values?.walletId ?? values?.wallet?.uuid;
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.transactionOriginalId =
      values?.transactionOriginalId ?? values?.payment?.id;
    this.clientBankIspb = values?.clientBankIspb ?? values?.clientBank?.ispb;
    this.clientBankName = values?.clientBankName ?? values?.clientBank?.name;
    this.thirdPartBankIspb =
      values?.thirdPartBankIspb ?? values?.thirdPartBank?.ispb;
    this.thirdPartBankName =
      values?.thirdPartBankName ?? values?.thirdPartBank?.name;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixDevolutionReceived {
    const entity = new PixDevolutionReceivedEntity(this.get({ plain: true }));
    entity.operation = new OperationEntity({ id: this.operationId });
    entity.user = new UserEntity({ uuid: this.userId });
    entity.wallet = new WalletEntity({ uuid: this.walletId });
    entity.payment =
      this.transactionOriginalId &&
      new PaymentEntity({ id: this.transactionOriginalId });
    entity.clientBank = new BankEntity({
      ispb: this.clientBankIspb,
      name: this.clientBankName,
    });
    entity.thirdPartBank = new BankEntity({
      ispb: this.thirdPartBankIspb,
      name: this.thirdPartBankName,
    });

    delete entity['operationId'];
    delete entity['userId'];
    delete entity['walletId'];
    delete entity['transactionOriginalId'];
    delete entity['clientBankIspb'];
    delete entity['clientBankName'];
    delete entity['thirdPartBankIspb'];
    delete entity['thirdPartBankName'];

    return entity;
  }

  hasReceipt(): boolean {
    return this.toDomain().hasReceipt();
  }
}
