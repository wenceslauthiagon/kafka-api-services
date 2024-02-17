import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions, Optional } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  CurrencyEntity,
  WalletAccount,
  WalletAccountEntity,
  WalletAccountState,
  WalletEntity,
} from '@zro/operations/domain';
import { WalletModel } from './wallet.model';
import { CurrencyModel } from './currency.model';

export type WalletAccountCacheAttributes = WalletAccount & {
  walletId?: number;
  walletUUID?: string;
  currencyId?: number;
};

export type WalletAccountCacheCreationAttributes = Optional<
  WalletAccountCacheAttributes,
  'id'
>;

@Table({
  tableName: 'wallet_account_caches',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class WalletAccountCacheModel
  extends DatabaseModel<
    WalletAccountCacheAttributes,
    WalletAccountCacheCreationAttributes
  >
  implements WalletAccount
{
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  uuid: string;

  @ForeignKey(() => WalletModel)
  @Column(DataType.INTEGER)
  walletId: number;

  @AllowNull(false)
  @Column({
    type: DataType.UUID,
    field: 'wallet_uuid',
  })
  walletUUID: string;

  @ForeignKey(() => CurrencyModel)
  @Column(DataType.INTEGER)
  currencyId: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('balance'));
    },
  })
  balance: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('pendingAmount'));
    },
  })
  pendingAmount: number;

  @AllowNull(false)
  @Default(WalletAccountState.ACTIVE)
  @Column(DataType.STRING)
  state: WalletAccountState;

  @BelongsTo(() => WalletModel)
  wallet: WalletModel;

  @AllowNull(true)
  @Column(DataType.STRING)
  accountNumber: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  branchNumber: string;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('averagePrice'));
    },
  })
  averagePrice: number;

  @BelongsTo(() => CurrencyModel)
  currency: CurrencyModel;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(values?: WalletAccountCacheAttributes, options?: BuildOptions) {
    super(values, options);
    this.walletId = values?.walletId ?? values?.wallet?.id;
    this.walletUUID = values?.walletUUID ?? values?.wallet?.uuid;
    this.currencyId = values?.currencyId ?? values?.currency?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WalletAccountEntity {
    const entity = new WalletAccountEntity(this.get({ plain: true }));

    // The currency exists if the repository included the currencyModel in the query,
    // otherwise, only the currencyId exists.
    if (this.currency) {
      entity.currency = this.currency.toDomain();
    } else if (this.currencyId) {
      entity.currency = new CurrencyEntity({ id: this.currencyId });
    }

    // The wallet exists if the repository included the walletModel in the query,
    // otherwise, only the uwalletId exists.
    if (this.wallet) {
      entity.wallet = this.wallet.toDomain();
    } else if (this.walletId) {
      entity.wallet = new WalletEntity({
        id: this.walletId,
        uuid: this.walletUUID,
      });
    }

    delete entity['walletId'];
    delete entity['walletUUID'];
    delete entity['currencyId'];

    return entity;
  }

  isActive(): boolean {
    return this.toDomain().isActive();
  }
}
