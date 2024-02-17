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
  NotifyCreditDevolution,
  NotifyCreditDevolutionEntity,
  NotifyStateType,
} from '@zro/api-jdpi/domain';
import { PersonType } from '@zro/users/domain';
import { AccountType } from '@zro/pix-payments/domain';

type NotifyCreditDevolutionAttributes = NotifyCreditDevolution;
type NotifyCreditDevolutionCreationAttributes =
  NotifyCreditDevolutionAttributes;

@Table({
  tableName: 'jdpi_notify_credit_devolutions',
  timestamps: true,
  underscored: true,
})
export class NotifyCreditDevolutionModel
  extends DatabaseModel<
    NotifyCreditDevolutionAttributes,
    NotifyCreditDevolutionCreationAttributes
  >
  implements NotifyCreditDevolution
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.UUID)
  externalId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  originalEndToEndId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  devolutionEndToEndId!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  devolutionCode: string;

  @Column(DataType.STRING)
  devolutionReason?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartIspb: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartPersonType: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartDocument: string;

  @Column(DataType.STRING)
  thirdPartBranch?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartAccountType: AccountType;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartAccountNumber: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientIspb: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientPersonType: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientDocument: string;

  @Column(DataType.STRING)
  clientBranch?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientAccountType: AccountType;

  @AllowNull(false)
  @Column(DataType.STRING)
  clientAccountNumber: string;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('amount'));
    },
  })
  amount: number;

  @Column(DataType.STRING)
  informationBetweenClients?: string;

  @Column(DataType.STRING)
  state: NotifyStateType;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyCreditDevolutionCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): NotifyCreditDevolution {
    const entity = new NotifyCreditDevolutionEntity(this.get({ plain: true }));
    return entity;
  }
}
