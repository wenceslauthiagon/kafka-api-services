import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional, BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  CurrencyEntity,
  OperationEntity,
  P2PTransfer,
  P2PTransferEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import { CurrencyModel } from './currency.model';
import { OperationModel } from './operation.model';

export type P2PTransferAttributes = P2PTransfer & {
  userId?: string;
  walletId?: string;
  beneficiaryWalletId?: string;
  operationId?: string;
  currencyId?: number;
  currencySymbol?: string;
};
export type P2PTransferCreationAttributes = Optional<
  P2PTransferAttributes,
  'id'
>;

@Table({
  tableName: 'p2p_transfers',
  timestamps: true,
  underscored: true,
})
export class P2PTransferModel
  extends DatabaseModel<P2PTransferAttributes, P2PTransferCreationAttributes>
  implements P2PTransfer
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @ForeignKey(() => CurrencyModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  currencyId: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  currencySymbol: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  walletId: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  beneficiaryWalletId: string;

  @ForeignKey(() => OperationModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  operationId: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('fee'));
    },
  })
  fee: number;

  @Column(DataType.STRING)
  description: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  // Don't use BelongsTo, because user is managed by another microservice.
  user: User;

  wallet: Wallet;
  beneficiaryWallet: Wallet;

  @BelongsTo(() => CurrencyModel)
  currency: CurrencyModel;

  @BelongsTo(() => OperationModel)
  operation: OperationModel;

  constructor(values?: P2PTransferCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.walletId = values?.walletId ?? values?.wallet?.uuid;
    this.beneficiaryWalletId =
      values?.beneficiaryWalletId ?? values?.beneficiaryWallet?.uuid;
    this.currencyId = values?.currencyId ?? values?.currency?.id;
    this.currencySymbol = values?.currencySymbol ?? values?.currency?.symbol;
    this.operationId = values?.operationId ?? values?.operation?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): P2PTransferEntity {
    const entity = new P2PTransferEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    entity.wallet = new WalletEntity({ uuid: this.walletId });
    entity.beneficiaryWallet = new WalletEntity({
      uuid: this.beneficiaryWalletId,
    });

    // The operation exists if the operationRepository includes the operationModel in the query,
    // otherwise, only the operationId exists.
    if (this.operation) {
      entity.operation = this.operation.toDomain();
    } else if (this.operationId) {
      entity.operation = new OperationEntity({ id: this.operationId });
    }

    // The currency exists if the operationRepository includes the currencyModel in the query,
    // otherwise, only the currencyId exists.
    if (this.currency) {
      entity.currency = this.currency.toDomain();
    } else if (this.currencyId) {
      entity.currency = new CurrencyEntity({
        id: this.currencyId,
        symbol: this.currencySymbol,
      });
    }

    delete entity['userId'];
    delete entity['walletId'];
    delete entity['beneficiaryWalletId'];
    delete entity['operationId'];
    delete entity['currencyId'];
    delete entity['currencySymbol'];

    return entity;
  }
}
