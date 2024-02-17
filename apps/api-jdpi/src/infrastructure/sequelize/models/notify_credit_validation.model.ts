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
import { PersonType } from '@zro/users/domain';
import {
  NotifyCreditValidation,
  PaymentPriorityLevelType,
  InitiationType,
  NotifyCreditValidationEntity,
  NotifyCreditValidationAmountDetails,
  NotifyCreditValidationState,
  ResultType,
  NotifyCreditValidationResponse,
} from '@zro/api-jdpi/domain';
import {
  AccountType,
  PixAgentMod,
  PaymentPriorityType,
  PixDevolutionCode,
} from '@zro/pix-payments/domain';
import { JdpiErrorCode } from '@zro/jdpi/domain';

type NotifyCreditValidationAttributes = NotifyCreditValidation & {
  responseResultType: ResultType;
  responseDevolutionCode?: JdpiErrorCode;
  responseDescription?: string;
  responseCreatedAt: Date;
};
type NotifyCreditValidationCreationAttributes =
  NotifyCreditValidationAttributes;

@Table({
  tableName: 'jdpi_notify_credit_validations',
  timestamps: true,
  underscored: true,
})
export class NotifyCreditValidationModel
  extends DatabaseModel<
    NotifyCreditValidationAttributes,
    NotifyCreditValidationCreationAttributes
  >
  implements NotifyCreditValidation
{
  @PrimaryKey
  @AllowNull(false)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  initiationType: InitiationType;

  @AllowNull(false)
  @Column(DataType.STRING)
  paymentPriorityType: PaymentPriorityType;

  @AllowNull(false)
  @Column(DataType.STRING)
  paymentPriorityLevelType: PaymentPriorityLevelType;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  finalityType: number;

  @Column(DataType.STRING)
  agentModalityType?: PixAgentMod;

  @Column(DataType.STRING)
  ispbPss?: string;

  @Column(DataType.STRING)
  paymentInitiatorDocument?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartIspb: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartPersonType: PersonType;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartDocument: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  thirdPartName: string;

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

  @Column(DataType.ARRAY(DataType.JSONB))
  amountDetails?: NotifyCreditValidationAmountDetails[];

  @Column(DataType.STRING)
  informationBetweenClients?: string;

  @Column(DataType.STRING)
  state?: NotifyCreditValidationState;

  @Column(DataType.STRING)
  endToEndId?: string;

  @Column(DataType.STRING)
  clientConciliationId?: string;

  @Column(DataType.STRING)
  key?: string;

  @Column(DataType.STRING)
  originalEndToEndId?: string;

  @Column(DataType.STRING)
  devolutionEndToEndId?: string;

  @Column(DataType.STRING)
  devolutionCode?: PixDevolutionCode;

  @Column(DataType.STRING)
  devolutionReason?: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  responseResultType: ResultType;
  response: NotifyCreditValidationResponse;

  @Column(DataType.STRING)
  responseDevolutionCode?: JdpiErrorCode;

  @Column(DataType.STRING)
  responseDescription?: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  responseCreatedAt: Date;

  @AllowNull(true)
  @Column(DataType.UUID)
  groupId?: string;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  constructor(
    values?: NotifyCreditValidationCreationAttributes,
    options?: BuildOptions,
  ) {
    super(values, options);
    this.responseResultType =
      values?.responseResultType ?? values?.response?.resultType;
    this.responseDevolutionCode =
      values?.responseDevolutionCode ??
      values?.response?.devolutionCode ??
      null;
    this.responseDescription =
      values?.responseDescription ?? values?.response?.description ?? null;
    this.responseCreatedAt =
      values?.responseCreatedAt ?? values?.response?.createdAt;
  }

  /**
   * Converts this model to an entity.
   * @returns An entity.
   */

  toDomain(): NotifyCreditValidation {
    const entity = new NotifyCreditValidationEntity(this.get({ plain: true }));

    const response: NotifyCreditValidationResponse = {
      resultType: this.responseResultType,
      ...(this.responseDevolutionCode && {
        devolutionCode: this.responseDevolutionCode,
      }),
      ...(this.responseDescription && {
        description: this.responseDescription,
      }),
      createdAt: this.responseCreatedAt,
    };

    entity.response = response;

    delete entity['responseResultType'];
    delete entity['responseDevolutionCode'];
    delete entity['responseDescription'];
    delete entity['responseCreatedAt'];

    return entity;
  }
}
