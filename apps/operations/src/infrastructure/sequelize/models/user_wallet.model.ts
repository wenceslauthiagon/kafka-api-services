import { BuildOptions } from 'sequelize';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { User, UserEntity } from '@zro/users/domain';
import {
  Wallet,
  WalletEntity,
  UserWallet,
  UserWalletEntity,
  PermissionType,
  PermissionTypeEntity,
} from '@zro/operations/domain';
import { WalletModel } from './wallet.model';

export type UserWalletAttributes = UserWallet & {
  userId: User['uuid'];
  walletId: Wallet['uuid'];
  permissionTypeIds?: string;
};
export type UserWalletCreationAttributes = UserWalletAttributes;

@Table({
  tableName: 'users_wallets',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class UserWalletModel
  extends Model<UserWalletAttributes, UserWalletCreationAttributes>
  implements UserWallet
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user: User;

  @ForeignKey(() => WalletModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  walletId: string;

  @BelongsTo(() => WalletModel)
  wallet: WalletModel;

  @AllowNull(false)
  @Column(DataType.STRING)
  permissionTypeIds?: string;
  permissionTypes: PermissionType[];

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(values?: UserWalletCreationAttributes, options?: BuildOptions) {
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
  toDomain(): UserWallet {
    const entity = new UserWalletEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    entity.permissionTypes = this.permissionTypeIds
      .split(',')
      .map((tag) => new PermissionTypeEntity({ tag }));

    // The wallet exists if the operationRepository includes the walletModel in the query,
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
}
