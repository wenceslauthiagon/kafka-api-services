import { BuildOptions, Optional } from 'sequelize';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import {
  UserWithdrawSettingRequest,
  UserWithdrawSettingRequestAnalysisResultType,
  UserWithdrawSettingRequestEntity,
  UserWithdrawSettingRequestState,
  WithdrawSettingType,
  WithdrawSettingWeekDays,
} from '@zro/compliance/domain';
import { User, UserEntity } from '@zro/users/domain';
import {
  TransactionType,
  TransactionTypeEntity,
  Wallet,
  WalletEntity,
} from '@zro/operations/domain';
import {
  DecodedPixKey,
  DecodedPixKeyEntity,
  PixKey,
  PixKeyEntity,
} from '@zro/pix-keys/domain';

export type UserWithdrawSettingRequestAttributes =
  UserWithdrawSettingRequest & {
    walletId?: string;
    userId?: string;
    transactionTypeTag?: string;
    pixKeyValue?: PixKey['key'];
    pixKeyType?: PixKey['type'];
    pixKeyDocument?: PixKey['document'];
    decodedPixKeyIspb?: DecodedPixKey['ispb'];
    decodedPixKeyBranch?: DecodedPixKey['branch'];
    decodedPixKeyAccountNumber?: DecodedPixKey['accountNumber'];
    decodedPixKeyName?: DecodedPixKey['name'];
    decodedPixKeyDocument?: DecodedPixKey['document'];
    decodedPixKeyCreatedAt?: DecodedPixKey['createdAt'];
  };

export type UserWithdrawSettingRequestCreationAttributes = Optional<
  UserWithdrawSettingRequestAttributes,
  'id'
>;

@Table({
  tableName: 'users_withdraws_settings_requests',
  timestamps: true,
  underscored: true,
})
export class UserWithdrawSettingRequestModel
  extends Model<
    UserWithdrawSettingRequestAttributes,
    UserWithdrawSettingRequestCreationAttributes
  >
  implements UserWithdrawSettingRequest
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: UserWithdrawSettingRequestState;

  @Column(DataType.STRING)
  analysisResult?: UserWithdrawSettingRequestAnalysisResultType;

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

  @Column(DataType.STRING)
  pixKeyDocument?: PixKey['document'];

  @Column(DataType.STRING)
  decodedPixKeyIspb?: DecodedPixKey['ispb'];

  @Column(DataType.STRING)
  decodedPixKeyBranch?: DecodedPixKey['branch'];

  @Column(DataType.STRING)
  decodedPixKeyAccountNumber?: DecodedPixKey['accountNumber'];

  @Column(DataType.STRING)
  decodedPixKeyName?: DecodedPixKey['name'];

  @Column(DataType.STRING)
  decodedPixKeyDocument?: DecodedPixKey['document'];

  @Column(DataType.DATE)
  decodedPixKeyCreatedAt?: DecodedPixKey['createdAt'];

  @Column(DataType.STRING)
  issueId?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @Column(DataType.DATE)
  closedAt?: Date;

  wallet: Wallet;

  user: User;

  transactionType: TransactionType;

  pixKey: PixKey;

  decodedPixKey?: DecodedPixKey;

  constructor(
    values?: UserWithdrawSettingRequestCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.walletId = values?.walletId ?? values?.wallet?.uuid;
    this.userId = values?.userId ?? values?.user?.uuid;
    this.transactionTypeTag =
      values?.transactionTypeTag ?? values?.transactionType?.tag;
    this.pixKeyValue = values?.pixKeyValue ?? values?.pixKey.key;
    this.pixKeyType = values?.pixKeyType ?? values?.pixKey.type;
    this.pixKeyDocument = values?.pixKeyDocument ?? values?.pixKey?.document;
    this.decodedPixKeyIspb =
      values?.decodedPixKeyIspb ?? values?.decodedPixKey?.ispb;
    this.decodedPixKeyBranch =
      values?.decodedPixKeyBranch ?? values?.decodedPixKey?.branch;
    this.decodedPixKeyAccountNumber =
      values?.decodedPixKeyAccountNumber ??
      values?.decodedPixKey?.accountNumber;
    this.decodedPixKeyName =
      values?.decodedPixKeyName ?? values?.decodedPixKey?.name;
    this.decodedPixKeyDocument =
      values?.pixKeyDocument ?? values?.decodedPixKey?.document;
    this.decodedPixKeyCreatedAt =
      values?.decodedPixKeyCreatedAt ?? values?.decodedPixKey?.createdAt;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): UserWithdrawSettingRequest {
    const entity = new UserWithdrawSettingRequestEntity(
      this.get({ plain: true }),
    );

    entity.wallet = new WalletEntity({ uuid: this.walletId });

    entity.user = new UserEntity({ uuid: this.userId });

    entity.transactionType = new TransactionTypeEntity({
      tag: this.transactionTypeTag,
    });

    entity.pixKey = new PixKeyEntity({
      type: this.pixKeyType,
      key: this.pixKeyValue,
      ...(this.pixKeyDocument && { document: this.pixKeyDocument }),
    });

    if (this.decodedPixKeyIspb) {
      entity.decodedPixKey = new DecodedPixKeyEntity({
        ispb: this.decodedPixKeyIspb,
        branch: this.decodedPixKeyBranch,
        accountNumber: this.decodedPixKeyAccountNumber,
        name: this.decodedPixKeyName,
        document: this.decodedPixKeyDocument,
        createdAt: this.decodedPixKeyCreatedAt,
      });
    }

    Reflect.deleteProperty(entity, 'walletId');

    Reflect.deleteProperty(entity, 'userId');

    Reflect.deleteProperty(entity, 'transactionTypeTag');

    Reflect.deleteProperty(entity, 'pixKeyType');
    Reflect.deleteProperty(entity, 'pixKeyValue');
    Reflect.deleteProperty(entity, 'pixKeyDocument');

    Reflect.deleteProperty(entity, 'decodedPixKeyIspb');
    Reflect.deleteProperty(entity, 'decodedPixKeyBranch');
    Reflect.deleteProperty(entity, 'decodedPixKeyAccountNumber');
    Reflect.deleteProperty(entity, 'decodedPixKeyName');
    Reflect.deleteProperty(entity, 'decodedPixKeyDocument');
    Reflect.deleteProperty(entity, 'decodedPixKeyCreatedAt');

    return entity;
  }
}
