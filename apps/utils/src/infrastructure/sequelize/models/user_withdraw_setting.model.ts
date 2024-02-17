import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  UserWithdrawSetting,
  UserWithdrawSettingEntity,
  WithdrawSettingState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/utils/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  TransactionType,
  TransactionTypeEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import { PixKey, PixKeyEntity } from '@zro/pix-keys/domain';

export type UserWithdrawSettingAttributes = UserWithdrawSetting & {
  walletId?: string;
  userId?: string;
  transactionTypeTag?: string;
  pixKeyValue?: PixKey['key'];
  pixKeyType?: PixKey['type'];
};

export type UserWithdrawSettingCreationAttributes = Optional<
  UserWithdrawSettingAttributes,
  'id'
>;

@Table({
  tableName: 'users_withdraws_settings',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class UserWithdrawSettingModel
  extends Model<
    UserWithdrawSettingAttributes,
    UserWithdrawSettingCreationAttributes
  >
  implements UserWithdrawSetting
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: WithdrawSettingState;

  @AllowNull(false)
  @Column(DataType.STRING)
  type!: WithdrawSettingType;

  @AllowNull(false)
  @Column({
    field: 'balance',
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('balance'));
    },
  })
  balance!: number;

  @Column(DataType.INTEGER)
  day?: number;

  @Column(DataType.STRING)
  weekDay?: WithdrawSettingWeekDays;

  @AllowNull(false)
  @Column(DataType.UUID)
  walletId!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  transactionTypeTag!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  pixKeyValue!: PixKey['key'];

  @AllowNull(false)
  @Column(DataType.STRING)
  pixKeyType!: PixKey['type'];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  wallet: Wallet;

  user: User;

  transactionType: TransactionType;

  pixKey: PixKey;

  constructor(
    values?: UserWithdrawSettingCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.walletId = values?.walletId ?? values?.wallet?.uuid;
    this.userId = values?.userId ?? values?.user?.uuid;
    this.transactionTypeTag =
      values?.transactionTypeTag ?? values?.transactionType?.tag;
    this.pixKeyValue = values?.pixKeyValue ?? values?.pixKey.key;
    this.pixKeyType = values?.pixKeyType ?? values?.pixKey.type;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserWithdrawSetting {
    const entity = new UserWithdrawSettingEntity(this.get({ plain: true }));

    entity.wallet = new WalletEntity({ uuid: this.walletId });

    entity.user = new UserEntity({ uuid: this.userId });

    entity.transactionType = new TransactionTypeEntity({
      tag: this.transactionTypeTag,
    });

    entity.pixKey = new PixKeyEntity({
      type: this.pixKeyType,
      key: this.pixKeyValue,
    });

    return entity;
  }
}
