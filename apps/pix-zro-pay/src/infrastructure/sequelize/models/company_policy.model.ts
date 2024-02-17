import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  AutoIncrement,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  CompanyPolicy,
  CompanyPolicyEntity,
  Company,
  CompanyEntity,
} from '@zro/pix-zro-pay/domain';

type CompanyPolicyAttributes = CompanyPolicy & {
  companyId: number;
};
type CompanyPolicyCreationAttributes = CompanyPolicyAttributes;

@Table({
  tableName: 'companies_policies',
  timestamps: true,
  underscored: true,
})
export class CompanyPolicyModel
  extends DatabaseModel<
    CompanyPolicyAttributes,
    CompanyPolicyCreationAttributes
  >
  implements CompanyPolicy
{
  @PrimaryKey
  @AllowNull(false)
  @AutoIncrement
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('id'));
    },
  })
  id: number;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('companyId'));
    },
  })
  companyId: number;
  company: Company;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  shouldRejectPaidByThirdPartyWhenCpf: boolean;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  shouldRejectPaidByThirdPartyWhenCnpj: boolean;

  @Column(DataType.INTEGER)
  maximumValueToStartRefundingPerClient?: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  qrcodeExpirationTimeInSeconds: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  webhookVersion: string;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  verifyKycTransactions: boolean;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  sendKycTransactions: boolean;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  constructor(values?: CompanyPolicyAttributes, options?: BuildOptions) {
    super(values, options);
    this.companyId = values?.companyId ?? values?.company?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): CompanyPolicy {
    const entity = new CompanyPolicyEntity(this.get({ plain: true }));
    entity.company = new CompanyEntity({ id: this.companyId });

    delete entity['companyId'];
    return entity;
  }
}
