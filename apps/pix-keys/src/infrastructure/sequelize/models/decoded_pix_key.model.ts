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
import { User, UserEntity, PersonType } from '@zro/users/domain';
import {
  KeyType,
  DecodedPixKey,
  DecodedPixKeyEntity,
  DecodedPixKeyState,
} from '@zro/pix-keys/domain';
import { AccountType } from '@zro/pix-payments/domain';

type DecodedPixKeyAttributes = DecodedPixKey & { userId?: string };
type DecodedPixKeyCreationAttributes = DecodedPixKeyAttributes;

@Table({
  tableName: 'pix_decoded_keys',
  timestamps: true,
  underscored: true,
})
export class DecodedPixKeyModel
  extends DatabaseModel<
    DecodedPixKeyAttributes,
    DecodedPixKeyCreationAttributes
  >
  implements DecodedPixKey
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: KeyType;

  @AllowNull(false)
  @Column(DataType.STRING)
  key: string;

  @Column(DataType.STRING)
  personType?: PersonType;

  @Column(DataType.STRING)
  document?: string;

  @Column(DataType.STRING)
  name?: string;

  @Column(DataType.STRING)
  tradeName?: string;

  @Column(DataType.STRING)
  accountNumber?: string;

  @Column(DataType.STRING)
  accountType?: AccountType;

  @Column(DataType.STRING)
  branch?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  ispb: string;

  @Column(DataType.BOOLEAN)
  activeAccount?: boolean;

  @Column(DataType.DATE)
  accountOpeningDate?: Date;

  @Column(DataType.DATE)
  keyCreationDate?: Date;

  @Column(DataType.DATE)
  keyOwnershipDate?: Date;

  @Column(DataType.DATE)
  claimRequestDate?: Date;

  @Column(DataType.STRING)
  endToEndId?: string;

  @Column(DataType.STRING)
  cidId?: string;

  @Column(DataType.INTEGER)
  dictAccountId?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  state: DecodedPixKeyState;

  @AllowNull(false)
  @Column(DataType.UUID)
  userId!: string;
  user: User;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: DecodedPixKeyCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.userId = values?.userId ?? values?.user?.uuid;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): DecodedPixKey {
    const entity = new DecodedPixKeyEntity(this.get({ plain: true }));
    entity.user = new UserEntity({ uuid: this.userId });
    return entity;
  }
}
