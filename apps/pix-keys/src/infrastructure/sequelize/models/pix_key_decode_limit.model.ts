import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import { PersonType } from '@zro/users/domain';
import {
  PixKeyDecodeLimit,
  PixKeyDecodeLimitEntity,
} from '@zro/pix-keys/domain';

type PixKeyDecodeLimitAttributes = PixKeyDecodeLimit;
type PixKeyDecodeLimitCreationAttributes = PixKeyDecodeLimitAttributes;

@Table({
  tableName: 'pix_key_decode_limits',
  timestamps: true,
  underscored: true,
})
export class PixKeyDecodeLimitModel
  extends DatabaseModel<
    PixKeyDecodeLimitAttributes,
    PixKeyDecodeLimitCreationAttributes
  >
  implements PixKeyDecodeLimit
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  limit: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  personType: PersonType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: PixKeyDecodeLimitCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixKeyDecodeLimit {
    const entity = new PixKeyDecodeLimitEntity(this.get({ plain: true }));
    return entity;
  }
}
