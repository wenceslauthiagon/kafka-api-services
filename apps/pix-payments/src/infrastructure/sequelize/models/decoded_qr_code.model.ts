import {
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { User, UserEntity, PersonType } from '@zro/users/domain';
import {
  AccountType,
  DecodedQrCode,
  DecodedQrCodeAdditionalInfo,
  DecodedQrCodeEntity,
  DecodedQrCodeState,
  DecodedQrCodeType,
  PixAgentMod,
} from '@zro/pix-payments/domain';

type DecodedQrCodeAttributes = DecodedQrCode & { userId?: string };
type DecodedQrCodeCreationAttributes = DecodedQrCodeAttributes;

@Table({
  tableName: 'pix_decoded_qr_code',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class DecodedQrCodeModel
  extends DatabaseModel<
    DecodedQrCodeAttributes,
    DecodedQrCodeCreationAttributes
  >
  implements DecodedQrCode
{
  @PrimaryKey
  @Column(DataType.UUID)
  id: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('documentValue'))
        return parseInt(this.getDataValue('documentValue'));
      return null;
    },
  })
  documentValue: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('paymentValue'))
        return parseInt(this.getDataValue('paymentValue'));
      return null;
    },
  })
  paymentValue?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('interestValue'))
        return parseInt(this.getDataValue('interestValue'));
      return null;
    },
  })
  interestValue?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('fineValue'))
        return parseInt(this.getDataValue('fineValue'));
      return null;
    },
  })
  fineValue?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('discountValue'))
        return parseInt(this.getDataValue('discountValue'));
      return null;
    },
  })
  discountValue?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('deductionValue'))
        return parseInt(this.getDataValue('deductionValue'));
      return null;
    },
  })
  deductionValue?: number;

  @Column(DataType.TEXT)
  emv: string;

  @Column(DataType.STRING)
  document?: string;

  @Column(DataType.STRING)
  cityCode?: string;

  @Column(DataType.DATE)
  paymentDate?: Date;

  @Column(DataType.STRING)
  key: string;

  @Column({
    type: DataType.STRING,
    field: 'txid',
  })
  txId: string;

  @Column(DataType.STRING)
  additionalInfo: string;

  @Column(DataType.STRING)
  recipientName: string;

  @Column(DataType.STRING)
  recipientPersonType: PersonType;

  @Column(DataType.STRING)
  recipientDocument: string;

  @Column(DataType.STRING)
  recipientIspb: string;

  @Column(DataType.STRING)
  recipientBranch: string;

  @Column(DataType.STRING)
  recipientAccountType: AccountType;

  @Column(DataType.STRING)
  recipientAccountNumber: string;

  @Column(DataType.STRING)
  recipientCity: string;

  @Column(DataType.STRING)
  endToEndId?: string;

  @Column(DataType.STRING)
  type: DecodedQrCodeType;

  @Column(DataType.BOOLEAN)
  allowUpdate: boolean;

  @Column(DataType.STRING)
  pss?: string;

  @Column(DataType.STRING)
  agentIspbWithdrawal?: string;

  @Column(DataType.STRING)
  agentModWithdrawal?: PixAgentMod;

  @Column(DataType.STRING)
  agentIspbChange?: string;

  @Column(DataType.STRING)
  agentModChange?: PixAgentMod;

  @Column(DataType.DATE)
  expirationDate?: Date;

  @Column(DataType.STRING)
  payerPersonType?: PersonType;

  @Column(DataType.STRING)
  payerDocument?: string;

  @Column(DataType.STRING)
  payerName?: string;

  @Column(DataType.STRING)
  status?: string;

  @Column(DataType.STRING)
  version?: string;

  @Column(DataType.JSON)
  additionalInfos?: DecodedQrCodeAdditionalInfo[];

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('withdrawValue'))
        return parseInt(this.getDataValue('withdrawValue'));
      return null;
    },
  })
  withdrawValue?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('changeValue'))
        return parseInt(this.getDataValue('changeValue'));
      return null;
    },
  })
  changeValue?: number;

  @Column(DataType.DATE)
  dueDate?: Date;

  @Column(DataType.STRING)
  state: DecodedQrCodeState;

  @Column(DataType.UUID)
  userId: string;
  user: User;

  @Column(DataType.STRING)
  recipientBankName: string;

  @Column(DataType.STRING)
  recipientBankIspb: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(
    values?: DecodedQrCodeCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);

    this.userId = values?.userId ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): DecodedQrCode {
    const entity = new DecodedQrCodeEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });

    delete entity['userId'];

    return entity;
  }

  isExpiredQrCode(): boolean {
    return this.toDomain().isExpiredQrCode();
  }
}
