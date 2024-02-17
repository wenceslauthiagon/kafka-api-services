import {
  AllowNull,
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
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import {
  PermissionType,
  PermissionTypeEntity,
  WalletEntity,
  WalletInvitation,
  WalletInvitationEntity,
  WalletInvitationState,
} from '@zro/operations/domain';
import { WalletModel } from './wallet.model';

export type WalletInvitationAttributes = WalletInvitation & {
  userId?: string;
  walletId?: string;
  permissionTypeIds?: string;
};
export type WalletInvitationCreationAttributes = WalletInvitationAttributes;

@Table({
  tableName: 'wallet_invitations',
  timestamps: true,
  underscored: true,
})
export class WalletInvitationModel
  extends DatabaseModel<
    WalletInvitationAttributes,
    WalletInvitationCreationAttributes
  >
  implements WalletInvitation
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId: string;

  @ForeignKey(() => WalletModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  walletId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: WalletInvitationState;

  @AllowNull(false)
  @Column(DataType.STRING)
  permissionTypeIds?: string;
  permissionTypes: PermissionType[];

  @Column(DataType.STRING)
  confirmCode: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  expiredAt: Date;

  @Column(DataType.DATE)
  acceptedAt: Date;

  @Column(DataType.DATE)
  declinedAt: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  // Don't use BelongsTo, because user is managed by another microservice.
  user: User;

  @BelongsTo(() => WalletModel)
  wallet: WalletModel;

  constructor(
    values?: WalletInvitationCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
    this.walletId = values?.walletId ?? values?.wallet?.uuid;
    this.permissionTypeIds =
      values?.permissionTypeIds ??
      values?.permissionTypes?.map(({ tag }) => tag)?.join(',');
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WalletInvitationEntity {
    const entity = new WalletInvitationEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    entity.permissionTypes = this.permissionTypeIds
      .split(',')
      .map((tag) => new PermissionTypeEntity({ tag }));

    // The wallet exists if the walletRepository includes the walletModel in the query,
    // otherwise, only the walletId exists.
    if (this.wallet) {
      entity.wallet = this.wallet.toDomain();
    } else if (this.walletId) {
      entity.wallet = new WalletEntity({ uuid: this.walletId });
    }

    delete entity['userId'];
    delete entity['walletId'];
    delete entity['permissionTypeIds'];

    return entity;
  }

  isExpiredWalletInvitation(): boolean {
    return this.toDomain().isExpiredWalletInvitation();
  }

  isAlreadyDeclinedWalletInvitation(): boolean {
    return this.toDomain().isAlreadyDeclinedWalletInvitation();
  }

  isAlreadyAcceptedWalletInvitation(): boolean {
    return this.toDomain().isAlreadyAcceptedWalletInvitation();
  }

  isAlreadyCanceledWalletInvitation(): boolean {
    return this.toDomain().isAlreadyCanceledWalletInvitation();
  }
}
