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
import {
  CryptoReportEntity,
  CryptoReport,
  CryptoReportType,
  Conversion,
  OperationBtcReceive,
  ConversionEntity,
  OperationBtcReceiveEntity,
} from '@zro/otc/domain';
import {
  Currency,
  CurrencyEntity,
  Operation,
  OperationEntity,
  Wallet,
  WalletAccount,
  WalletAccountEntity,
  WalletEntity,
} from '@zro/operations/domain';
import { User, UserEntity } from '@zro/users/domain';

type CryptoReportAttributes = CryptoReport & {
  userId: User['uuid'];
  cryptoId: Currency['id'];
  conversionId?: Conversion['id'];
  operationId?: Operation['id'];
  operationBtcReceiveId?: OperationBtcReceive['id'];
  walletAccountId: WalletAccount['uuid'];
  walletId: Wallet['uuid'];
};
type CryptoReportCreationAttributes = CryptoReportAttributes;

@Table({
  tableName: 'crypto_reports',
  timestamps: true,
  underscored: true,
})
export class CryptoReportModel
  extends DatabaseModel<CryptoReportAttributes, CryptoReportCreationAttributes>
  implements CryptoReport
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: CryptoReportType;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('cryptoAmount'))
        return parseInt(this.getDataValue('cryptoAmount'));
      return null;
    },
  })
  cryptoAmount: number;

  @AllowNull(true)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('cryptoPrice'))
        return parseInt(this.getDataValue('cryptoPrice'));
      return null;
    },
  })
  cryptoPrice?: number;

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  accuratePrice?: boolean;

  @AllowNull(true)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('fiatAmount'))
        return parseInt(this.getDataValue('fiatAmount'));
      return null;
    },
  })
  fiatAmount?: number;

  @AllowNull(true)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('avgPrice'))
        return parseInt(this.getDataValue('avgPrice'));
      return null;
    },
  })
  avgPrice?: number;

  @AllowNull(true)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('cryptoBalance'))
        return parseInt(this.getDataValue('cryptoBalance'));
      return null;
    },
  })
  cryptoBalance?: number;

  @AllowNull(true)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('profit'))
        return parseInt(this.getDataValue('profit'));
      return null;
    },
  })
  profit?: number;

  @AllowNull(true)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('loss')) return parseInt(this.getDataValue('loss'));
      return null;
    },
  })
  loss?: number;

  @AllowNull(true)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('profitLossPercentage'))
        return parseInt(this.getDataValue('profitLossPercentage'));
      return null;
    },
  })
  profitLossPercentage?: number;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;
  user: User;

  @AllowNull(false)
  @Column(DataType.UUID)
  cryptoId: number;
  crypto: Currency;

  @AllowNull(true)
  @Column(DataType.UUID)
  conversionId?: string;
  conversion?: Conversion;

  @AllowNull(true)
  @Column(DataType.UUID)
  operationId?: string;
  operation?: Operation;

  @AllowNull(true)
  @Column(DataType.UUID)
  operationBtcReceiveId?: string;
  operationBtcReceive?: OperationBtcReceive;

  @AllowNull(false)
  @Column(DataType.UUID)
  walletAccountId: string;
  walletAccount: WalletAccount;

  @AllowNull(false)
  @Column(DataType.UUID)
  walletId: string;
  wallet: Wallet;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: CryptoReportCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid ?? null;
    this.cryptoId = values?.cryptoId ?? values?.crypto?.id ?? null;
    this.conversionId = values?.conversionId ?? values?.conversion?.id ?? null;
    this.operationId = values?.operationId ?? values?.operation?.id ?? null;
    this.operationBtcReceiveId =
      values?.operationBtcReceiveId ?? values?.operationBtcReceive?.id ?? null;
    this.walletAccountId =
      values?.walletAccountId ?? values?.walletAccount?.uuid ?? null;
    this.walletId = values?.walletId ?? values?.wallet?.uuid ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): CryptoReport {
    const entity = new CryptoReportEntity(this.get({ plain: true }));
    entity.user = this.userId && new UserEntity({ uuid: this.userId });
    entity.crypto = this.cryptoId && new CurrencyEntity({ id: this.cryptoId });
    entity.conversion =
      this.conversionId && new ConversionEntity({ id: this.conversionId });
    entity.operation =
      this.operationId && new OperationEntity({ id: this.operationId });
    entity.operationBtcReceive =
      this.operationBtcReceiveId &&
      new OperationBtcReceiveEntity({
        id: this.operationBtcReceiveId,
      });
    entity.walletAccount =
      this.walletAccountId &&
      new WalletAccountEntity({
        uuid: this.walletAccountId,
      });
    entity.wallet =
      this.walletId &&
      new WalletEntity({
        uuid: this.walletId,
      });

    delete entity['userId'];
    delete entity['cryptoId'];
    delete entity['conversionId'];
    delete entity['operationId'];
    delete entity['operationBtcReceiveId'];
    delete entity['walletAccountId'];
    delete entity['walletId'];

    return entity;
  }

  isTypeBeneficiary(): boolean {
    return this.toDomain().isTypeBeneficiary();
  }
}
