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
import { DatabaseModel, Failed, FailedEntity } from '@zro/common';
import {
  AccountType,
  DecodedPixAccount,
  DecodedPixAccountEntity,
  DecodedQrCode,
  DecodedQrCodeEntity,
  Payment,
  PaymentEntity,
  PaymentPriorityType,
  PaymentState,
  PaymentType,
  PixAgentMod,
} from '@zro/pix-payments/domain';
import { DecodedPixKey, DecodedPixKeyEntity } from '@zro/pix-keys/domain';
import { User, UserEntity, PersonType } from '@zro/users/domain';
import {
  Operation,
  OperationEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';

type PaymentAttributes = Payment & {
  userId?: string;
  walletId?: string;
  operationId?: string;
  changeOperationId?: string;
  decodedQrCodeId?: string;
  decodedPixKeyId?: string;
  decodedPixAccountId?: string;
  failedCode?: string;
  failedMessage?: string;
};
type PaymentCreationAttributes = PaymentAttributes;

@Table({
  tableName: 'pix_payments',
  timestamps: true,
  underscored: true,
})
export class PaymentModel
  extends DatabaseModel<PaymentAttributes, PaymentCreationAttributes>
  implements Payment
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.UUID)
  operationId: string;
  operation: Operation;

  @Column(DataType.UUID)
  changeOperationId: string;
  changeOperation: Operation;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: PaymentState;

  @Column(DataType.STRING)
  key: string;

  @Column({
    type: DataType.STRING,
    field: 'txid',
  })
  txId: string;

  @Column(DataType.UUID)
  decodedQrCodeId: string;
  decodedQrCode: DecodedQrCode;

  @Column(DataType.UUID)
  decodedPixKeyId: string;
  decodedPixKey: DecodedPixKey;

  @Column(DataType.UUID)
  decodedPixAccountId: string;
  decodedPixAccount: DecodedPixAccount;

  @AllowNull(false)
  @Column(DataType.STRING)
  transactionTag: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  paymentType: PaymentType;

  @Column(DataType.STRING)
  priorityType: PaymentPriorityType;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryAccountType!: AccountType;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryPersonType!: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryBranch!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryAccountNumber!: string;

  @Column(DataType.STRING)
  beneficiaryBankName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryBankIspb!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  beneficiaryDocument!: string;

  @Column(DataType.STRING)
  beneficiaryName: string;

  @Column(DataType.STRING)
  agentMod?: PixAgentMod;

  @Column(DataType.STRING)
  agentIspb?: string;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('value'));
    },
  })
  value!: number;

  @Column(DataType.STRING)
  endToEndId: string;

  @Column(DataType.DATE)
  paymentDate: Date;

  @Column(DataType.STRING)
  description: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user: User;

  @AllowNull(false)
  @Column(DataType.UUID)
  walletId!: string;
  wallet: Wallet;

  @AllowNull(false)
  @Column(DataType.STRING)
  ownerAccountNumber!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  ownerBranch!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  ownerDocument!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  ownerPersonType!: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  ownerFullName!: string;

  @Column(DataType.STRING)
  chargebackReason?: string;

  @Column(DataType.STRING)
  failedMessage?: string;

  @Column(DataType.STRING)
  failedCode?: string;
  failed?: Failed;

  @Column(DataType.UUID)
  externalId?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column(DataType.DATE)
  confirmedAt: Date;

  @Column(DataType.DATE)
  canceledAt: Date;

  constructor(values?: PaymentAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.walletId = values?.walletId ?? values?.wallet?.uuid;
    this.operationId = values?.operationId ?? values?.operation?.id;
    this.changeOperationId =
      values?.changeOperationId ?? values?.changeOperation?.id;
    this.decodedQrCodeId = values?.decodedQrCodeId ?? values?.decodedQrCode?.id;
    this.decodedPixKeyId = values?.decodedPixKeyId ?? values?.decodedPixKey?.id;
    this.decodedPixAccountId =
      values?.decodedPixAccountId ?? values?.decodedPixAccount?.id;
    this.failedCode = values?.failedCode ?? values?.failed?.code ?? null;
    this.failedMessage =
      values?.failedMessage ?? values?.failed?.message ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Payment {
    const entity = new PaymentEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    entity.wallet = new WalletEntity({ uuid: this.walletId });
    entity.operation = new OperationEntity({ id: this.operationId });
    entity.changeOperation =
      this.changeOperationId &&
      new OperationEntity({ id: this.changeOperationId });
    entity.decodedQrCode =
      this.decodedQrCodeId &&
      new DecodedQrCodeEntity({ id: this.decodedQrCodeId });
    entity.decodedPixKey =
      this.decodedPixKeyId &&
      new DecodedPixKeyEntity({ id: this.decodedPixKeyId });
    entity.decodedPixAccount =
      this.decodedPixAccountId &&
      new DecodedPixAccountEntity({ id: this.decodedPixAccountId });
    entity.failed =
      this.failedCode &&
      this.failedMessage &&
      new FailedEntity({ code: this.failedCode, message: this.failedMessage });

    delete entity['userId'];
    delete entity['walletId'];
    delete entity['operationId'];
    delete entity['changeOperationId'];
    delete entity['decodedQrCodeId'];
    delete entity['decodedPixKeyId'];
    delete entity['decodedPixAccountId'];
    delete entity['failedCode'];
    delete entity['failedMessage'];

    return entity;
  }

  isScheduledPayment(): boolean {
    return this.toDomain().isScheduledPayment();
  }

  isTodayPayment(): boolean {
    return this.toDomain().isTodayPayment();
  }

  hasReceipt(): boolean {
    return this.toDomain().hasReceipt();
  }

  isAlreadyPaid(): boolean {
    return this.toDomain().isAlreadyPaid();
  }

  isStateValidForCanceling(): boolean {
    return this.toDomain().isStateValidForCanceling();
  }

  isAlreadyCompletedPayment(): boolean {
    return this.toDomain().isAlreadyCompletedPayment();
  }
}
