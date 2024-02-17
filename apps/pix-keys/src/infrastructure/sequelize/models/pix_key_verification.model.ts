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
  DeletedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  PixKey,
  PixKeyEntity,
  PixKeyVerification,
  PixKeyVerificationEntity,
  PixKeyVerificationState,
} from '@zro/pix-keys/domain';
import { PixKeyModel } from './pix_key.model';

type PixKeyVerificationAttributes = PixKeyVerification & { pixKeyId?: string };
type PixKeyVerificationCreationAttributes = PixKeyVerificationAttributes;

@Table({
  tableName: 'pix_key_verifications',
  timestamps: true,
  underscored: true,
  paranoid: true,
})
export class PixKeyVerificationModel
  extends DatabaseModel<
    PixKeyVerificationAttributes,
    PixKeyVerificationCreationAttributes
  >
  implements PixKeyVerification
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

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: PixKeyVerificationState;

  @AllowNull(false)
  @Column(DataType.STRING)
  code!: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @DeletedAt
  deletedAt: Date;

  pixKey: PixKey;

  constructor(
    values?: PixKeyVerificationCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.pixKeyId = values?.pixKeyId ?? values?.pixKey?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixKeyVerification {
    const entity = new PixKeyVerificationEntity(this.get({ plain: true }));
    entity.pixKey = new PixKeyEntity({ id: this.pixKeyId });
    return entity;
  }
}
