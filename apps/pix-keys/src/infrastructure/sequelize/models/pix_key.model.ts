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
import { User, UserEntity, PersonType } from '@zro/users/domain';
import {
  PixKeyReasonType,
  KeyState,
  KeyType,
  PixKey,
  PixKeyEntity,
  PixKeyClaim,
  PixKeyClaimEntity,
} from '@zro/pix-keys/domain';

type PixKeyAttributes = PixKey & {
  userId?: string;
  failedCode?: string;
  failedMessage?: string;
  claimId?: string;
};
type PixKeyCreationAttributes = PixKeyAttributes;

@Table({
  tableName: 'pix_keys',
  timestamps: true,
  underscored: true,
})
export class PixKeyModel
  extends DatabaseModel<PixKeyAttributes, PixKeyCreationAttributes>
  implements PixKey
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  key: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type!: KeyType;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: KeyState;

  @AllowNull(true)
  @Column(DataType.STRING)
  code: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  personType!: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  document!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user: User;

  @AllowNull(false)
  @Column(DataType.STRING)
  accountNumber!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  branch!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  accountOpeningDate!: Date;

  @AllowNull(true)
  @Column(DataType.STRING)
  failedMessage?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  failedCode?: string;
  failed?: Failed;

  @AllowNull(true)
  @Column(DataType.STRING)
  deletedByReason?: PixKeyReasonType;

  @AllowNull(true)
  @Column(DataType.UUID)
  claimId?: string;
  claim?: PixKeyClaim;

  @AllowNull(true)
  @Column(DataType.DATE)
  canceledAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  deletedAt: Date;

  constructor(values?: PixKeyCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.failedCode = values?.failedCode ?? values?.failed?.code ?? null;
    this.failedMessage =
      values?.failedMessage ?? values?.failed?.message ?? null;
    this.claimId = values?.claimId ?? values?.claim?.id ?? null;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixKey {
    const entity = new PixKeyEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    entity.failed =
      this.failedCode &&
      this.failedMessage &&
      new FailedEntity({ code: this.failedCode, message: this.failedMessage });
    entity.claim = this.claimId && new PixKeyClaimEntity({ id: this.claimId });

    delete entity['userId'];
    delete entity['failedCode'];
    delete entity['failedMessage'];
    delete entity['claimId'];

    return entity;
  }

  isSendCodeState(): boolean {
    return this.toDomain().isSendCodeState();
  }

  isSendCodeType(): boolean {
    return this.toDomain().isSendCodeType();
  }

  isVerifiedCodeState(): boolean {
    return this.toDomain().isVerifiedCodeState();
  }

  isVerifiedCodeValue(code: string): boolean {
    return this.toDomain().isVerifiedCodeValue(code);
  }

  isCancelValidationState(): boolean {
    return this.toDomain().isCancelValidationState();
  }

  isCancelValidationType(): boolean {
    return this.toDomain().isCancelValidationType();
  }

  isReadyState(): boolean {
    return this.toDomain().isReadyState();
  }

  isCanceledState(): boolean {
    return this.toDomain().isCanceledState();
  }
}
