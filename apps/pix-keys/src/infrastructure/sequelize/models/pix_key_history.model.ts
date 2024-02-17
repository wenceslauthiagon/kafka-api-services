import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  Default,
  BelongsTo,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  KeyState,
  PixKey,
  PixKeyHistory,
  PixKeyHistoryEntity,
} from '@zro/pix-keys/domain';
import { PixKeyModel } from './pix_key.model';
import { User, UserEntity } from '@zro/users/domain';

type PixKeyAttributes = PixKeyHistory & {
  pixKeyId?: string;
  userId?: string;
  pixKey: { userId?: string };
};
type PixKeyCreationAttributes = PixKeyAttributes;

@Table({
  tableName: 'pix_key_histories',
  timestamps: true,
  underscored: true,
})
export class PixKeyHistoryModel
  extends DatabaseModel<PixKeyAttributes, PixKeyCreationAttributes>
  implements PixKeyHistory
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @ForeignKey(() => PixKeyModel)
  @AllowNull(false)
  @Column(DataType.UUID)
  pixKeyId!: string;

  @BelongsTo(() => PixKeyModel)
  pixKey: PixKey;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: KeyState;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  userId!: string;
  user!: User;

  constructor(values?: PixKeyCreationAttributes, options?: BuildOptions) {
    super(values, options);
    this.pixKeyId = values?.pixKeyId ?? values?.pixKey?.id;
    this.userId = values?.pixKey?.userId ?? values?.pixKey?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixKeyHistory {
    const entity = new PixKeyHistoryEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    return entity;
  }
}
