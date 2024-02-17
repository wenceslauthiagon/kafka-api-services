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
import { DatabaseModel } from '@zro/common';
import {
  NotifyStateType,
  NotifyClaim,
  NotifyClaimEntity,
} from '@zro/api-topazio/domain';
import {
  KeyType,
  ClaimReasonType,
  ClaimStatusType,
  ClaimType,
} from '@zro/pix-keys/domain';
import { PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';

type NotifyClaimAttributes = NotifyClaim;
type NotifyClaimCreationAttributes = NotifyClaimAttributes;

@Table({
  tableName: 'topazio_notify_claims',
  timestamps: true,
  underscored: true,
})
export class NotifyClaimModel
  extends DatabaseModel<NotifyClaimAttributes, NotifyClaimCreationAttributes>
  implements NotifyClaim
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  externalId!: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  accountOpeningDate: Date;

  @AllowNull(true)
  @Column(DataType.STRING)
  accountType: AccountType;

  @AllowNull(true)
  @Column(DataType.STRING)
  branch: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  accountNumber: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  claimReason: ClaimReasonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  claimType!: ClaimType;

  @AllowNull(true)
  @Column(DataType.STRING)
  document: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  donation!: boolean;

  @AllowNull(true)
  @Column(DataType.STRING)
  donorIspb: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  requestIspb: string;

  @AllowNull(true)
  @Column(DataType.DATE)
  endCompleteDate: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  endResolutionDate: Date;

  @AllowNull(true)
  @Column(DataType.DATE)
  lastChangeDate: Date;

  @AllowNull(true)
  @Column(DataType.STRING)
  ispb: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  key!: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  keyType: KeyType;

  @AllowNull(true)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  personType: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  status!: ClaimStatusType;

  @AllowNull(false)
  @Column(DataType.STRING)
  state!: NotifyStateType;

  @AllowNull(true)
  @Column(DataType.STRING)
  tradeName: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(values?: NotifyClaimCreationAttributes, options?: BuildOptions) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyClaim {
    const entity = new NotifyClaimEntity(this.get({ plain: true }));
    return entity;
  }
}
