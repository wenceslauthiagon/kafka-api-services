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
  Operation,
  OperationEntity,
  OperationState,
  WalletAccount,
  TransactionTypeEntity,
  WalletAccountEntity,
  OperationAnalysisTag,
  UserLimitTracker,
  UserLimitTrackerEntity,
} from '@zro/operations/domain';
import { CurrencyModel } from './currency.model';
import { TransactionTypeModel } from './transaction_type.model';

export type OperationAttributes = Operation & {
  ownerId?: number;
  ownerWalletAccountId?: number;
  beneficiaryId?: number;
  beneficiaryWalletAccountId?: number;
  transactionTypeId?: number;
  currencyId?: number;
  operationRefId?: string;
  chargebackId?: string;
  userLimitTrackerId?: string;
};
export type OperationCreationAttributes = Optional<OperationAttributes, 'id'>;

@Table({
  tableName: 'Operations',
  timestamps: true,
  underscored: true,
})
export class OperationModel
  extends DatabaseModel<OperationAttributes, OperationCreationAttributes>
  implements Operation
{
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  emitterId: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  receiverId: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  ownerId: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.INTEGER,
    field: 'owner_wallet_id',
  })
  ownerWalletAccountId: number;

  @AllowNull(false)
  @Default(0)
  @Column(DataType.INTEGER)
  beneficiaryId: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.INTEGER,
    field: 'beneficiary_wallet_id',
  })
  beneficiaryWalletAccountId: number;

  @ForeignKey(() => TransactionTypeModel)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  transactionTypeId: number;

  @ForeignKey(() => CurrencyModel)
  @AllowNull(false)
  @Column({
    type: DataType.INTEGER,
    field: 'currency_type_id',
  })
  currencyId: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('rawValue'));
    },
  })
  rawValue?: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('fee'));
    },
  })
  fee?: number;

  @AllowNull(false)
  @Default(0)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('value'));
    },
  })
  value: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  description: string;

  @AllowNull(false)
  @Default(OperationState.ACCEPTED)
  @Column(DataType.STRING)
  state: OperationState;

  @ForeignKey(() => OperationModel)
  @Column(DataType.UUID)
  operationRefId?: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('ownerRequestedRawValue'))
        return parseInt(this.getDataValue('ownerRequestedRawValue'));
      return null;
    },
  })
  ownerRequestedRawValue?: number;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      if (this.getDataValue('ownerRequestedFee'))
        return parseInt(this.getDataValue('ownerRequestedFee'));
      return null;
    },
  })
  ownerRequestedFee?: number;

  @Column({
    type: DataType.UUID,
    field: 'chargeback',
  })
  chargebackId?: string;
  chargeback?: Operation;

  // Don't use belongsTo because User model is not available in operations microservice.
  owner?: User;

  // Don't use belongsTo because somebody set id to zero instead of null where
  // there is no owner. Zero is not a valid ID on wallet account table.
  // Elvis has left the building!
  ownerWalletAccount?: WalletAccount;

  // Don't use belongs to because User model is not available in operations microservice.
  beneficiary?: User;

  // Don't use belongsTo because somebody set id to zero instead of null when
  // there is no beneficiary. Zero is not a valid ID on wallet account table.
  // Elvis has left the building!
  beneficiaryWalletAccount?: WalletAccount;

  @AllowNull(true)
  @Column(DataType.ARRAY(DataType.STRING))
  analysisTags?: OperationAnalysisTag[];

  @AllowNull(true)
  @Column(DataType.UUID)
  userLimitTrackerId?: string;
  userLimitTracker?: UserLimitTracker;

  @BelongsTo(() => TransactionTypeModel)
  transactionType: TransactionTypeModel;

  @BelongsTo(() => CurrencyModel)
  currency: CurrencyModel;

  @BelongsTo(() => OperationModel)
  operationRef?: OperationModel;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column(DataType.DATE)
  revertedAt?: Date;

  constructor(values?: OperationCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.ownerId = values?.ownerId ?? values?.owner?.id ?? 0;
    this.ownerWalletAccountId =
      values?.ownerWalletAccountId ?? values?.ownerWalletAccount?.id ?? 0;
    this.beneficiaryId = values?.beneficiaryId ?? values?.beneficiary?.id ?? 0;
    this.beneficiaryWalletAccountId =
      values?.beneficiaryWalletAccountId ??
      values?.beneficiaryWalletAccount?.id ??
      0;
    this.transactionTypeId =
      values?.transactionTypeId ?? values?.transactionType?.id;
    this.currencyId = values?.currencyId ?? values?.currency?.id;
    this.operationRefId =
      values?.operationRefId ?? values?.operationRef?.id ?? null;
    this.chargebackId = values?.chargebackId ?? values?.chargeback?.id ?? null;
    this.userLimitTrackerId =
      values?.userLimitTrackerId ?? values?.userLimitTracker?.id ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Operation {
    const entity = new OperationEntity(this.get({ plain: true }));

    // The transactionType exists if the operationRepository includes the transactionTypeModel in the query,
    // otherwise, only the transactionTypeId exists.
    if (this.transactionType) {
      entity.transactionType = this.transactionType.toDomain();
    } else if (this.transactionTypeId) {
      entity.transactionType = new TransactionTypeEntity({
        id: this.transactionTypeId,
      });
    }

    // The currency exists if the operationRepository includes the currencyModel in the query,
    // otherwise, only the currencyId exists.
    if (this.currency) {
      entity.currency = this.currency.toDomain();
    } else if (this.currencyId) {
      entity.currency = new CurrencyEntity({ id: this.currencyId });
    }

    // The operationRef exists if the operationRepository includes the operationRefModel in the query,
    // otherwise, only the operationRefId exists.
    if (this.operationRef) {
      entity.operationRef = this.operationRef.toDomain();
    } else if (this.operationRefId) {
      entity.operationRef = new OperationEntity({ id: this.operationRefId });
    } else {
      entity.operationRef = null;
    }

    if (this.chargebackId) {
      entity.chargeback = new OperationEntity({ id: this.chargebackId });
    }

    if (this.ownerId) {
      entity.owner = new UserEntity({ id: this.ownerId });
      entity.ownerWalletAccount = new WalletAccountEntity({
        id: this.ownerWalletAccountId,
      });
    }

    if (this.beneficiaryId) {
      entity.beneficiary = new UserEntity({ id: this.beneficiaryId });
      entity.beneficiaryWalletAccount = new WalletAccountEntity({
        id: this.beneficiaryWalletAccountId,
      });
    }

    // The userLimitTracker exists if the operation transaction type is limited by user.
    if (this.userLimitTrackerId) {
      entity.userLimitTracker = new UserLimitTrackerEntity({
        id: this.userLimitTrackerId,
      });
    }

    delete entity['userLimitTrackerId'];

    return entity;
  }

  isPending(): boolean {
    return this.toDomain().isPending();
  }

  isAccepted(): boolean {
    return this.toDomain().isAccepted();
  }

  isReverted(): boolean {
    return this.toDomain().isReverted();
  }
}
