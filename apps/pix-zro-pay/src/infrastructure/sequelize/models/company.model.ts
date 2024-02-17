import {
  AllowNull,
  Column,
  DataType,
  PrimaryKey,
  Table,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
  AutoIncrement,
} from 'sequelize-typescript';
import { BuildOptions } from 'sequelize';
import { DatabaseModel } from '@zro/common';
import {
  Company,
  BankAccount,
  Plan,
  User,
  CompanyEntity,
  PlanEntity,
  UserEntity,
  BankAccountEntity,
} from '@zro/pix-zro-pay/domain';

type CompanyAttributes = Company & {
  matrixId?: number;
  planId: number;
  responsibleId?: number;
  activeBankForCashInId?: number;
  activeBankForCashOutId?: number;
};
type CompanyCreationAttributes = CompanyAttributes;

@Table({
  tableName: 'companies',
  timestamps: true,
  underscored: true,
})
export class CompanyModel
  extends DatabaseModel<CompanyAttributes, CompanyCreationAttributes>
  implements Company
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
  id?: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  tradingName: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  cnpj: string;

  @Column(DataType.STRING)
  ie?: string;

  @Column(DataType.STRING)
  phone?: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('matrixId')) || null;
    },
  })
  matrixId?: number;
  matrix?: Company;

  @AllowNull(false)
  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('planId'));
    },
  })
  planId: number;
  plan: Plan;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('responsibleId')) || null;
    },
  })
  responsibleId?: number;
  responsible?: User;

  @Column(DataType.STRING)
  webhookTransaction?: string;

  @Column(DataType.STRING)
  webhookWithdraw?: string;

  @Column(DataType.STRING)
  xApiKey?: string;

  @Column(DataType.STRING)
  identifier?: string;

  @Column(DataType.BOOLEAN)
  isRetailer?: boolean;

  @Column(DataType.BOOLEAN)
  requireClientDocument?: boolean;

  @Column(DataType.STRING)
  phoneNumber?: string;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('activeBankForCashInId')) || null;
    },
  })
  activeBankForCashInId?: number;
  activeBankForCashIn?: BankAccount;

  @Column({
    type: DataType.BIGINT,
    get(): number {
      return parseInt(this.getDataValue('activeBankForCashOutId')) || null;
    },
  })
  activeBankForCashOutId?: number;
  activeBankForCashOut?: BankAccount;

  @Column(DataType.STRING)
  zroUserId?: string;

  @Column(DataType.STRING)
  zroUserKey?: string;

  @Column({
    type: DataType.STRING,
    field: 'type_pix_key',
  })
  pixKeyType?: string;

  @Column(DataType.STRING)
  pixKey?: string;

  @Column(DataType.BOOLEAN)
  showQrCodeInfoToPayer?: boolean;

  @Column(DataType.STRING)
  email?: string;

  @Column(DataType.STRING)
  webhookRefund?: string;

  @Column(DataType.STRING)
  webhookKyc?: string;

  @CreatedAt
  createdAt?: Date;

  @UpdatedAt
  updatedAt?: Date;

  @DeletedAt
  deletedAt?: Date;

  constructor(values?: CompanyAttributes, options?: BuildOptions) {
    super(values, options);
    this.planId = values?.planId ?? values?.plan?.id;
    this.matrixId = values?.matrixId ?? values?.matrix?.id;
    this.responsibleId = values?.responsibleId ?? values?.responsible?.id;
    this.activeBankForCashInId =
      values?.activeBankForCashInId ?? values?.activeBankForCashIn?.id;
    this.activeBankForCashOutId =
      values?.activeBankForCashOutId ?? values?.activeBankForCashOut?.id;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */
  toDomain(): Company {
    const entity = new CompanyEntity(this.get({ plain: true }));
    entity.plan = new PlanEntity({ id: this.planId });
    entity.matrix = this.matrixId && new CompanyEntity({ id: this.matrixId });
    entity.responsible =
      this.responsibleId && new UserEntity({ id: this.responsibleId });
    entity.activeBankForCashIn =
      this.activeBankForCashInId &&
      new BankAccountEntity({
        id: this.activeBankForCashInId,
      });
    entity.activeBankForCashOut =
      this.activeBankForCashOutId &&
      new BankAccountEntity({
        id: this.activeBankForCashOutId,
      });

    delete entity['planId'];
    delete entity['matrixId'];
    delete entity['responsibleId'];
    delete entity['activeBankForCashInId'];
    delete entity['activeBankForCashOutId'];

    return entity;
  }
}
