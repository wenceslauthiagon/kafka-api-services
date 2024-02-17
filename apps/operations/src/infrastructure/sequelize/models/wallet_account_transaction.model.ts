import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  createIndexDecorator,
  DataType,
  Default,
  ForeignKey,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional, BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  Operation,
  OperationEntity,
  WalletAccount,
  WalletAccountEntity,
  WalletAccountTransaction,
  WalletAccountTransactionEntity,
  WalletAccountTransactionState,
  WalletAccountTransactionType,
} from '@zro/operations/domain';
import { WalletAccountModel } from './wallet_account.model';
import { OperationModel } from './operation.model';

const TagUnique = createIndexDecorator({
  name: 'Wallet_account_transactions_key',
  unique: true,
});

export type WalletAccountTransactionAttributes = WalletAccountTransaction & {
  operationId?: string;
  walletAccountId?: number;
};

export type WalletAccountTransactionCreationAttributes = Optional<
  WalletAccountTransactionAttributes,
  'id'
>;

@Table({
  tableName: 'Wallet_account_transactions',
  timestamps: true,
  underscored: true,
})
export class WalletAccountTransactionModel
  extends DatabaseModel<
    WalletAccountTransactionAttributes,
    WalletAccountTransactionCreationAttributes
  >
  implements WalletAccountTransaction
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.STRING)
  id?: string;

  @ForeignKey(() => WalletAccountModel)
  @AllowNull(false)
  @TagUnique
  @Column(DataType.INTEGER)
  walletAccountId: number;

  @ForeignKey(() => OperationModel)
  @AllowNull(false)
  @TagUnique
  @Column(DataType.STRING)
  operationId: string;

  @AllowNull(false)
  @TagUnique
  @Column(DataType.STRING)
  transactionType: WalletAccountTransactionType;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('value'));
    },
  })
  value: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('previousBalance'));
    },
  })
  previousBalance: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('updatedBalance'));
    },
  })
  updatedBalance: number;

  @AllowNull(false)
  @Default(WalletAccountTransactionState.DONE)
  @Column(DataType.STRING)
  state: WalletAccountTransactionState;

  @BelongsTo(() => WalletAccountModel)
  walletAccount: WalletAccount;

  @BelongsTo(() => OperationModel)
  operation: Operation;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: WalletAccountTransactionCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.walletAccountId = values?.walletAccountId ?? values?.walletAccount?.id;
    this.operationId = values?.operationId ?? values?.operation?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WalletAccountTransactionEntity {
    const entity = new WalletAccountTransactionEntity(
      this.get({ plain: true }),
    );
    entity.walletAccount = new WalletAccountEntity({
      id: this.walletAccountId,
    });
    entity.operation = new OperationEntity({ id: this.operationId });

    delete entity['operationId'];
    delete entity['walletAccountId'];

    return entity;
  }
}
