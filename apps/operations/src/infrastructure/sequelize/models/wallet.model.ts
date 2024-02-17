import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { Optional, BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { User, UserEntity } from '@zro/users/domain';
import { Wallet, WalletEntity, WalletState } from '@zro/operations/domain';

export type WalletAttributes = Wallet & { userId?: number; userUUID?: string };
export type WalletCreationAttributes = Optional<WalletAttributes, 'id'>;

@Table({
  tableName: 'Wallets',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class WalletModel
  extends DatabaseModel<WalletAttributes, WalletCreationAttributes>
  implements Wallet
{
  @PrimaryKey
  @AllowNull(false)
  @AutoIncrement
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  uuid: string;

  @AllowNull(false)
  @Default(WalletState.ACTIVE)
  @Column(DataType.STRING)
  state: WalletState;

  @Column(DataType.INTEGER)
  userId: number;

  @Column({
    type: DataType.UUID,
    field: 'user_uuid',
  })
  userUUID: string;

  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  default: boolean;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt?: Date;

  // Don't use BelongsTo, because user is managed by another microservice.
  user: User;

  constructor(values?: WalletCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.id;
    this.userUUID = values?.userUUID ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): WalletEntity {
    const entity = new WalletEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ id: this.userId, uuid: this.userUUID });

    delete entity['userId'];
    delete entity['userUUID'];

    return entity;
  }

  isActive(): boolean {
    return this.toDomain().isActive();
  }
}
