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
import {
  PixKeyClaim,
  PixKeyClaimEntity,
  ClaimType,
  ClaimStatusType,
  KeyType,
} from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';

type PixKeyClaimAttributes = PixKeyClaim;
type PixKeyClaimCreationAttributes = PixKeyClaimAttributes;

@Table({
  tableName: 'pix_key_claims',
  timestamps: true,
  underscored: true,
})
export class PixKeyClaimModel
  extends DatabaseModel<PixKeyClaimAttributes, PixKeyClaimCreationAttributes>
  implements PixKeyClaim
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  keyType: KeyType;

  @AllowNull(false)
  @Column(DataType.STRING)
  key: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: ClaimType;

  @AllowNull(false)
  @Column(DataType.STRING)
  status: ClaimStatusType;

  @AllowNull(false)
  @Column(DataType.STRING)
  ispb: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  document?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  branch?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  accountNumber?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  personType?: PersonType;

  @AllowNull(true)
  @Column(DataType.DATE)
  finalResolutionDate?: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  finalCompleteDate?: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  lastChangeDate?: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  claimOpeningDate?: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  claimClosingDate?: Date;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: PixKeyClaimCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): PixKeyClaim {
    const entity = new PixKeyClaimEntity(this.get({ plain: true }));
    return entity;
  }
}
